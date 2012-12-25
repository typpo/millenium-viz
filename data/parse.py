#!/usr/bin/env python
# pulls xyz coords from all galaxy data

import csv
import sys

json = len(sys.argv) > 2 and sys.argv[2] == 'json'
n = -1
if len(sys.argv) > 3:
  n = int(sys.argv[3])

with open(sys.argv[1], 'r') as datafile:
  reader = csv.DictReader(datafile)
  if json:
    print '{"positions":['

  first = True
  c = 0
  for row in reader:
    if json:
      if not first:
        print ',',
      print '[%s, %s, %s]' % (row['x'], row['y'], row['z'])
    else:
      print '%s %s %s' % (row['x'], row['y'], row['z'])
    first = False
    c += 1
    if n > -1 and c >= n:
      break

  if json:
    print ']}'
