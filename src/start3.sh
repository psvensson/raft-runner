DEBUG=* node src/cli.js --path .raft/data3 --id id3 --port 8061 --peers '[{"id":"id1", "url":"tcp://192.168.86.210:8041"}, {"id":"id2", "url":"tcp://192.168.86.210:8051"}, {"id":"id3", "url":"tcp://192.168.86.210:8061"}]'