#!/usr/bin/env python
# pulls xyz coords from all galaxy data

import csv
import sys

with open(sys.argv[1], 'r') as datafile:
  reader = csv.DictReader(datafile)
  for row in reader:
    print '%s %s %s' % (row['x'], row['y'], row['z'])
