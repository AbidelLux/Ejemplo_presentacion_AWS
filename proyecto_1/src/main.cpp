#include <iostream>
#include <cstring>
#include "../lib/scanner.h"

int main(int argc, char *argv[]) {
    scanner scan;
    bool apiMode = false;
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--api") == 0) {
            apiMode = true;
        }
    }
    if (apiMode) {
        scan.startApi();
    } else {
        scan.start();
    }
}