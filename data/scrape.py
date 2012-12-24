#!/usr/bin/env python
# Scrapes part of the milli-millenium galaxy db

import urllib2
import sys
from urllib import urlencode

galaxyID = int(sys.argv[1])
OUTPUT = sys.argv[2]

while True:
  print 'Querying galaxyID %d+' % galaxyID

  data = {
    'action': 'doQuery',
    'queryMode': 'stream',
    'batch': 'false',
    'SQL': 'select * from millimil..DeLucia2006a where galaxyID > %d' % galaxyID,
  }

  req = urllib2.Request('http://galaxy-catalogue.dur.ac.uk:8080/Millennium/MyDB', data=urlencode(data))
  resp = urllib2.urlopen(req).read()

  entries = resp.splitlines()[68:-7]

  galaxyID = int(entries[-1].split(',')[0])    # last id

  f = open(OUTPUT, 'a')
  f.write('\n'.join(entries))
  f.close()
