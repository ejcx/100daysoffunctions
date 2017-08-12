# Makefile 
NAME	     := "onehundredfunctions"
DEPENDENCIES := "node yarn "
VERSION	     := $(shell git describe --tags --always --dirty="-dev")
DATE	     := $(shell date -u '+%Y-%m-%dT%H:%MZ')
TAG          := "$(VERSION)"

Q=@

all: build

build: node_modules clean
	zip -r $(NAME).zip functions/* node_modules

clean:
	-rm -rf $(NAME).zip

node_modules:
	yarn

.PHONY: *
print-%: ; @echo $*=$($*)
