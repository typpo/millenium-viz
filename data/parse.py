#!/usr/bin/env python
# pulls xyz coords from all galaxy data

import csv
import sys

if len(sys.argv) < 3:
  print 'usage: parse data.csv output.json [# galaxies]'
  sys.exit(1)

n = -1
if len(sys.argv) > 3:
  n = int(sys.argv[3])

OUTPUT = sys.argv[2]
print 'Output to', OUTPUT

SPREAD_FACTOR = 30
dedup = {}

# build index and squash dataset
print 'Indexing...'
def doround(x, base=10):
  return int(base * round(float(x)/base))

with open(sys.argv[1], 'r') as datafile:
  reader = csv.DictReader(datafile)

  c = 0
  for row in reader:
    normalized_x = doround(float(row['x']) * SPREAD_FACTOR)
    normalized_y = doround(float(row['y']) * SPREAD_FACTOR)
    normalized_z = doround(float(row['z']) * SPREAD_FACTOR)
    triple = (normalized_x, normalized_y, normalized_z)

    dedup.setdefault(triple, [])
    dedup[triple].append((float(row['diskRadius']), float(row['sfr'])))

    c += 1
    if c % 50000 == 0:
      print c, '...'
    if n > 0 and c > n:
      break

# now squash close galaxies into blobs
blobs = []
blobbed_count = 0
print 'Blobbing...'
c = 0
for key, val in dedup.iteritems():
  if len(val) > 1:
    blobbed_count += 1
    # additive disk radius, average star formation rate
    try:
      diskRadius = 0.0
      for v in val:
        diskRadius += v[0]
      sfr = 0.0
      for v in val:
        sfr += v[1]
      sfr /= len(val)
      #diskRadius = reduce(lambda x, y: x['diskRadius'] + y['diskRadius'], val)
      #sfr = reduce(lambda x, y: x['sfr'] + y['sfr'], val) / len(val)
    except:
      print 'Error with val:'
      print val
      sys.exit(1)

    blobs.append({
      'x': key[0],
      'y': key[1],
      'z': key[2],
      'diskRadius': diskRadius,
      'sfr': sfr,
    })
  else:
    blobs.append({
      'x': key[0],
      'y': key[1],
      'z': key[2],
      'diskRadius': val[0][0],
      'sfr': val[0][1],
    })

  c += 1
  if c % 50000 == 0:
    print c, '...'

print 'Blobbed count:', blobbed_count

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

print c, ' total'
print 'Done.'
