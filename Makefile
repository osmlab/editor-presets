BUILDJS_TARGETS = \
	./categories.json \
	./fields.json \
	./presets.json \
	./presets.yaml \
	./taginfo.json

BUILDJS_SOURCES = \
	$(filter-out $(BUILDJS_TARGETS), $(shell find . -type f -name '*.json'))

all: $(BUILDJS_TARGETS) node_modules/.install

$(BUILDJS_TARGETS): $(BUILDJS_SOURCES) build.js
	node build.js

node_modules/.install: package.json
	npm install && touch node_modules/.install

clean:
	rm -f $(BUILDJS_TARGETS)
