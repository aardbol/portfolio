.PHONY: build serve

build:
	node scripts/build.js

serve:
	python3 -m http.server 8080 --bind 127.0.0.1
