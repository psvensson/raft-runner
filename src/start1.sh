#DEBUG=* node src/cli.js --path .raft/data1 --id id1 --port 8041 --peers '[{"id":"id1", "url":"tcp://192.168.86.210:8041", "www":"http://192.168.86.210:8042"}, {"id":"id2", "url":"tcp://192.168.86.210:8051"}, {"id":"id3", "url":"tcp://192.168.86.210:8061"}]'
DEBUG=* node src/cli.js --path .raft/data1 --id id1 --port 8041 --peers '[{"id":"id1", "url":"tcp://192.168.86.210:8041", "www":"http://192.168.86.210:8042", "pub":"http://192.168.86.210:8043"},{"id":"id2", "url":"tcp://192.168.86.210:8051", "www":"http://192.168.86.210:8052", "pub":"http://192.168.86.210:8053"},{"id":"id3", "url":"tcp://192.168.86.210:8061", "www":"http://192.168.86.210:8062", "pub":"http://192.168.86.210:8063"}]'