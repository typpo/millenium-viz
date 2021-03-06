#!/usr/bin/env python
# pulls xyz coords from all galaxy data
# NOTE fullbox is the latest one - up to coords 250, 250, 250

import csv
import sys
import random
from rtree import index
from math import sqrt

if len(sys.argv) < 3:
  print 'usage: parse data.csv output.json [# galaxies]'
  sys.exit(1)

n = -1
if len(sys.argv) > 3:
  n = int(sys.argv[3])

OUTPUT = sys.argv[2]
print 'Output to', OUTPUT

SPREAD_FACTOR = 30
ROUNDING_AMOUNT = 25   # number of units to round
dedup = {}

props = index.Property()
props.dimension = 3
idx = index.Index('3d_index', properties=props)

# build index and squash dataset
print 'Indexing...'
def doround(x, base=ROUNDING_AMOUNT):
  return int(base * round(float(x)/base))

#id_to_obj = {}
id_to_key = {}
next_id = 0

with open(sys.argv[1], 'r') as datafile:
  reader = csv.DictReader(datafile)

  c = 0
  for row in reader:
    try:
      f_x = float(row['x'])
    except:
      print 'Bad x value:', row['x']
      continue
    f_y = float(row['y'])
    f_z = float(row['z'])
    normalized_x = doround(f_x * SPREAD_FACTOR)
    normalized_y = doround(f_y * SPREAD_FACTOR)
    normalized_z = doround(f_z * SPREAD_FACTOR)
    triple = (normalized_x, normalized_y, normalized_z)

    dedup.setdefault(triple, [])
    obj = (f_x, f_y, f_z, float(row['diskRadius']), float(row['sfr']))
    dedup[triple].append(obj)

    #print (next_id, (normalized_x, normalized_y, normalized_z, normalized_x, normalized_y, normalized_z))
    idx.insert(next_id, (normalized_x, normalized_y, normalized_z, normalized_x, normalized_y, normalized_z))
    #id_to_obj[next_id] = obj
    id_to_key[next_id] = triple
    next_id += 1

    c += 1
    if c % 50000 == 0:
      print c, '...'
    if n > 0 and c > n:
      break

print len(dedup.keys()), 'galaxy buckets in first rounded pass'
print 'Adjusting lonely galaxy buckets...'
c = 0
adjusted_count = 0
for key in dedup.keys():
  c += 1
  if c % 50000 == 0:
    print c, '(', adjusted_count, ')', '...'

  val = dedup[key]
  #if len(val) > 10:
  #  continue

  vx = key[0]
  vy = key[1]
  vz = key[2]

  nearest_id = list(idx.nearest((vx, vy, vz, vx, vy, vz), 1))[0]
  #nearest_obj = id_to_obj[nearest_id]
  nearest_key = id_to_key[nearest_id]

  dist = sqrt((nearest_key[0] - vx)**2 + (nearest_key[1] - vy)**2 + (nearest_key[2] - vz)**2)
  if dist > SPREAD_FACTOR * ROUNDING_AMOUNT / 2: # in pixels
    # don't join it with nearest
    continue

  adjusted_count += 1
  dedup[nearest_key].extend(val)
  del dedup[key]

  continue

  # put lonely ones into nearby buckets
  def trybucket(tries, x, y, z):
    coord = (x, y, z)
    if coord in dedup and len(dedup[coord]) > 1:
      tries.append(coord)

  new_buckets = []
  for n in range(1, 80):
    i = n * ROUNDING_AMOUNT
    trybucket(new_buckets, vx + i, vy, vz)
    trybucket(new_buckets, vx - i, vy, vz)
    trybucket(new_buckets, vx, vy + i, vz)
    trybucket(new_buckets, vx, vy - i, vz)
    trybucket(new_buckets, vx, vy, vz + i)
    trybucket(new_buckets, vx, vy, vz - i)
    trybucket(new_buckets, vx + i, vy + i, vz)
    trybucket(new_buckets, vx - i, vy - i, vz)
    trybucket(new_buckets, vx + i, vy - i, vz)
    trybucket(new_buckets, vx - i, vy + i, vz)
    trybucket(new_buckets, vx, vy + i, vz + i)
    trybucket(new_buckets, vx, vy - i, vz - i)
    trybucket(new_buckets, vx, vy + i, vz - i)
    trybucket(new_buckets, vx, vy - i, vz + i)
    trybucket(new_buckets, vx + i, vy, vz + i)
    trybucket(new_buckets, vx - i, vy, vz - i)
    trybucket(new_buckets, vx + i, vy, vz - i)
    trybucket(new_buckets, vx - i, vy, vz + i)

  if len(new_buckets) > 1:
    dedup[random.choice(new_buckets)].append(val[0])
    adjusted_count += 1
    del dedup[key]

print adjusted_count, 'lonely galaxies re-sorted into nearby buckets'

# now squash close galaxies into blobs
blobs = []
blobbed_count = 0
blobbed_total = 0
print 'Blobbing...'
c = 0
for key, val in dedup.iteritems():
  if len(val) > 1:
    blobbed_count += 1
    blobbed_total += len(val)
    # additive disk radius, average star formation rate
    try:
      x = y = z = diskRadius = sfr = 0.0
      for v in val:
        x += v[0]
        y += v[1]
        z += v[2]
        diskRadius += v[3]
        sfr += v[4]
      sfr /= len(val)
      x /= len(val)
      y /= len(val)
      z /= len(val)
    except:
      print 'Error with val:'
      print val
      sys.exit(1)

    blobs.append({
      'x': x,
      'y': y,
      'z': z,
      'diskRadius': diskRadius,
      'sfr': sfr,
    })
  else:
    blobs.append({
      'x': val[0][0],
      'y': val[0][1],
      'z': val[0][2],
      'diskRadius': val[0][3],
      'sfr': val[0][4],
    })

  c += 1
  if c % 50000 == 0:
    print c, '...'

print 'Blobbed count: compressed', blobbed_total, 'to', blobbed_count

# main output
print 'Writing output to', OUTPUT
f = open(OUTPUT, 'w')
f.write('{"positions":[')
first = True
c = 0
for blob in blobs:
  if not first:
    f.write(',')
  try:
    f.write('[%f, %f, %f, %f, %f]\n' \
        % (float(blob['x']), float(blob['y']), float(blob['z']), float(blob['diskRadius']), float(blob['sfr'])))
    c += 1
  except:
    pass

  first = False

f.write(']}')
f.close()

print c, 'total'
print 'Done.'
