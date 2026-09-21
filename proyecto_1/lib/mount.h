#ifndef MOUNT_H
#define MOUNT_H

#include <string>
#include <bits/stdc++.h>
#include "../lib/shared.h"
#include "../lib/structs.h"
#include "../lib/disco.h"

using namespace std;

class Mount {
    public:
    Mount();
  //  es nuestra partcion montada, la cual tiene un nombre, una letra y un status
    typedef struct _MP
    {
        char letter;
        char status = '0';
        char name[20];
    }MountedPartition;

  //  es nuestro disco montado, el cual tiene una ruta, un status y una lista de particiones montadas
    typedef struct _MD
    {
        char path[150];
        char status = '0';
        MountedPartition mpartitions[26];
    }MountedDisc;//disco a montar

    MountedDisc mounted[99];

    void mount(vector<string> context);

    void unmount(vector<string> context);

    void mount(string p, string n);

    void unmount(string id);

    void listmount();//esto nos sirve para listar las particiones montadas

    Structs::Partition getmount(string id, string *p);

    private:
    Disk dsk;
    Shared shared;
    vector<char> alfabeto = {'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r',
                             's', 't', 'u', 'v', 'w', 'x', 'y', 'z'};
};
#endif