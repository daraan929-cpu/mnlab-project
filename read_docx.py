import zipfile
import xml.etree.ElementTree as ET

try:
    with zipfile.ZipFile('00000.docx') as z:
        xml_content = z.read('word/document.xml')
        tree = ET.fromstring(xml_content)
        text = '\n'.join([node.text for node in tree.iter() if node.text])
        with open('extracted_text.txt', 'w', encoding='utf-8') as f:
            f.write(text)
        print("Success")
except Exception as e:
    with open('extracted_text.txt', 'w', encoding='utf-8') as f:
        f.write(str(e))
