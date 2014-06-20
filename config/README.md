Instructions of Configuration
=============================

Files within this folder, excluding this `README.md`, will be regarded as
configuration variables. They will be read once at program startup.

All files are defined to be simple text files in encoding of UTF-8. The text
of such files will be parsed according to following rules:

0. When the file is not accessible, the variablename, assigned by filename,
   will not be reserved. Otherwise, the filename will be taken as variable
   name.
0. File content, including comments, will be trim'ed(meaning its prefixing and
   appending spaces are elimated).
0. Comments are one or more lines prefixing the file, each of which starts with
   a `#`. No more comments are acknowledged in other places.
0. The remaining data in this file, will be parsed first as JSON data. When
   this process is not successful, they will be taken as String-typed data.

**Example: `storage-path`**

    # This variable specifies the path of the storage file. Please use
    # absolute path!

    "/opt/jabberc.db"

------------------------------------------------------------------------------

配置说明
========

本目录中的文件，除去这个`README.md`，都被程序认为是配置变量。在程序启动时它们
将被一次性加载。

所有的文件都是简单的，UTF-8编码的文本文件。将依照如下规则解析这些文件：

0. 如果文件无法访问，就会忽略。否则，文件名就作为配置变量名。
0. 文件内容包括注释，都将被首先除去前后的空格。
0. 文件只能在开头包含一行或多行注释。其他位置的注释将不被认可。
0. 文件中剩余的内容，将按照JSON格式解析。如果解析失败，数据格式就以字符串代替。

**示例: `storage-path`**

    # 本文件指定了存储文件的位置。请使用绝对路径！

    "/opt/jabberc.db"

------------------------------------------------------------------------------

Anleitung zur Einstellung
=========================

Alle Dateien innerhalb dieses Verzeichnis außer dieses `README.md`, werden als
eingestellten Variablen vom Programm gelesen. Beim Starten werden sie einmalig
eingelesen.

Alle Dateien sind einfach Texte in UTF-8. Folgende Regeln gelten beim Lesen:

0. Datei wird ignoriert wenn sie unlesbar ist. Sonst wird deren Name als Namen
   der Variable genutzt.
0. Alle Lücke vor und nach dem Inhalt innerhalb der Datei wird erst gelöscht.
0. Anerkannt werden lediglich die Kommentare am Anfang der Datei, die im Form
   einer oder mehrerer Zeile anfangs mit `#` geschrieben sind.
0. Alle übrigen Datei wird erst als JSON-Form gelesen, wenn dies gescheitert
   hätte, werden sie als String-Typ gespeichert.

**Beispiel: `storage-path`**
    # Diese Datei zeigt dem Programm den Ort der Datei zum Speichern. Nutzen
    # Sie absolute Addresse!

    "/opt/jabberc.db"
