OBJECTS = main.o ../include/scanner.o ../include/disco.o ../include/mount.o ../include/shared.o ../include/filesystem.o ../include/filemanager.o ../include/report.o ../include/users.o

run: $(OBJECTS)
	g++ -o $@ $(OBJECTS)

main.o: main.cpp
	g++ -c main.cpp -I../lib

../include/scanner.o: ../include/scanner.cpp
	g++ -c ../include/scanner.cpp -I../lib -o ../include/scanner.o

../include/disco.o: ../include/disco.cpp
	g++ -c ../include/disco.cpp -I../lib -o ../include/disco.o

../include/mount.o: ../include/mount.cpp
	g++ -c ../include/mount.cpp -I../lib -o ../include/mount.o

../include/shared.o: ../include/shared.cpp
	g++ -c ../include/shared.cpp -I../lib -o ../include/shared.o

../include/filesystem.o: ../include/filesystem.cpp
	g++ -c ../include/filesystem.cpp -I../lib -o ../include/filesystem.o

../include/filemanager.o: ../include/filemanager.cpp
	g++ -c ../include/filemanager.cpp -I../lib -o ../include/filemanager.o

../include/report.o: ../include/report.cpp
	g++ -c ../include/report.cpp -I../lib -o ../include/report.o

../include/users.o: ../include/users.cpp
	g++ -c ../include/users.cpp -I../lib -o ../include/users.o
clean:
	rm -f run main.o ../include/*.o