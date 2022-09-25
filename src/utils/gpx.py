from xml.etree import ElementTree as ET


def reverse_gpx_trackpts(xml_str):
    ET.register_namespace("", "http://www.topografix.com/GPX/1/1")

    root = ET.fromstring(xml_str)

    trkseg = [
        child for child in root.findall(".//{http://www.topografix.com/GPX/1/1}trkseg")
    ]
    for seg in trkseg:
        pts = [pt for pt in seg.findall("{http://www.topografix.com/GPX/1/1}trkpt")][
            ::-1
        ]
        for pt in seg.findall("{http://www.topografix.com/GPX/1/1}trkpt"):
            seg.remove(pt)
        for pt in pts:
            seg.append(pt)
    return root
