#!/usr/bin/env python
# Scrapes part of the milli-millenium galaxy db

import urllib2
import sys
import secrets
import base64
from urllib import urlencode

if len(sys.argv) != 3:
  print "usage: scrape.py starting_galaxy_id output"
  print "If you are starting anew, set starting_galaxy_id to -1"
  sys.exit(1)

galaxyID = int(sys.argv[1])
OUTPUT = sys.argv[2]
test = len(sys.argv) > 4 and sys.argv[3] == 'test'

done = False
while not done:
  print 'Querying galaxyID %d+' % galaxyID

  if test:
    url = 'http://galaxy-catalogue.dur.ac.uk:8080/Millennium/MyDB'
  else:
    url = 'http://gavo.mpa-garching.mpg.de/MyMillennium/MyDB'

  if test:
    query = 'select * from millimil..DeLucia2006a where snapnum=63 and galaxyID > %d' % galaxyID
  else:
    topGalaxyID = galaxyID + 9994849000313
    query = 'select galaxyID,x,y,z,diskRadius,sfr from MPAGalaxies..DeLucia2006a where snapnum=63 and x between -250 and 250 and y between -250 and 250 and z between -250 and 250 and galaxyID between %d and %d order by galaxyId asc' \
        % (galaxyID, topGalaxyID)


  data = {
    'action': 'doQuery',
    'queryMode': 'stream',
    'batch': 'false',
    'SQL': query,
  }

  req = urllib2.Request(url, data=urlencode(data))
  if not test:
    base64string = base64.encodestring('%s:%s' \
        % (secrets.DB_USERNAME, secrets.DB_PASSWORD)).replace('\n', '')
    req.add_header("Authorization", "Basic %s" % base64string)
  resp = urllib2.urlopen(req).read()

  #entries = resp.splitlines()[68:-7]   #if we expect timeout
  entries = resp.splitlines()[13:-1]   # if we don't expect timeout

  try:
    galaxyID = int(entries[-1].split(',')[0])    # last id
  except IndexError:
    done = True
  except ValueError:
    # nothing in these query results
    galaxyID = topGalaxyID
    continue

  f = open(OUTPUT, 'a')
  f.write('\n'.join(entries))
  f.close()

  print 'Wrote', str(len(entries)), 'galaxies'

print 'Done.'
