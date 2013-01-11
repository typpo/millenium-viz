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
with open(sys.argv[1], 'r') as datafile:
  reader = csv.DictReader(datafile)

  c = 0
  for row in reader:
    normalized_x = int(float(row['x']) * SPREAD_FACTOR)
    normalized_y = int(float(row['y']) * SPREAD_FACTOR)
    normalized_z = int(float(row['z']) * SPREAD_FACTOR)
    triple = (normalized_x, normalized_y, normalized_z)

    dedup.setdefault(triple, [])
    row['diskRadius'] = float(row['diskRadius'])
    row['sfr'] = float(row['sfr'])
    dedup[triple].append(row)

    c += 1
    if n > 0 and c > n:
      break

# now squash close galaxies into blobs
blobs = []
blobbed_count = 0
for key, val in dedup.iteritems():
  if len(val) > 1:
    blobbed_count += 1
    # additive disk radius, average star formation rate
    diskRadius = reduce(lambda x, y: x['diskRadius'] + y['diskRadius'], val)
    sfr = reduce(lambda x, y: x['sfr'] + y['sfr'], val) / len(val)

    blobs.append({
      'x': key[0],
      'y': key[1],
      'z': key[2],
      'diskRadius': diskRadius,
      'sfr': sfr,
    })
  else:
    blobs.append(val[0])

print 'Blobbed count:', blobbed_count

# main output
f = open(OUTPUT, 'w')
f.write('{"positions":[')
first = True
for blob in blobs:
  if not first:
    f.write(',')
  try:
    f.write('[%f, %f, %f, %f, %f]\n' \
        % (float(blob['x']), float(blob['y']), float(blob['z']), float(blob['diskRadius']), float(blob['sfr'])))
  except:
    pass

  first = False

f.write(']}')
f.close()
