### <p style='color:green'>b012_data is a Flutter package for data manipulations. It create an sqlite database for your app, generate all your entity tables and ensure their CRUD (create, read, update and delete) on the SQLite database with bunch of generic methods. It also provide system file manipulation for files of type text and binaries (Videos, audio,images, pdf, etc.). B012_data store or reload them as file, string, base64 string or Unit8List.</p>
<a href="https://pub.dev/packages/b012_data"> Clic here to get B012_data dependency for your flutter project. </a>

### For a class to consider like a B012_data entity, it must these five steps below :

    import 'package:b012_data/b012_disc_data.dart';
    import 'package:flutter/material.dart';
    import 'package:b012_data/b012_sqlflite_easy.dart';

    //Person entity
    class Person {
       String idPers;
       String firstName;
       String lastName;
       bool sex;
       DateTime dateOfBirth;
       //String email;
       //String profestion;

       //Step 1:
       MapEntry<String,bool> get pKeyAuto => const MapEntry('idPers', false);//primay key, required
       List<String> get notNulls => <String>['firstName','lastName','sex','dateOfBirth'];//Not nulable columns, optional
       //List<String> get uniques => <String>['email']; //unique colums, optional
       //Map<String,String> get checks => {'email':'length(email)>4'}; //check constrains, optional
       //Map<String,String> get defaults => {'profestion':'NULL'};//defaul value of columns, optional
       //Map<String,List<String>> get fKeys => {'profestion':['Profestion','idProf']};//foreign keys, optional

       //Step 2: required
       Person([this.idPers, this.firstName, this.lastName, this.sex, this.dateOfBirth]);//use by get methods

       //Step 3: required
       Map<String,dynamic> toMap() => {
         "idPers": idPers??ColumnType.String,
         "firstName": firstName??ColumnType.String,
         "lastName": lastName??ColumnType.String,
         "sex": sex??ColumnType.bool,
         "dateOfBirth": dateOfBirth??ColumnType.DateTime,
       };

       //Step 4: required
       Person.fromMap(dynamic jsonOrMap,{bool isInt=true}){
         idPers=jsonOrMap["idPers"];
         firstName=jsonOrMap["firstName"];
         lastName=jsonOrMap["lastName"];
         sex=boolean(jsonOrMap["sex"],isInt: isInt);
         dateOfBirth=dateTime(jsonOrMap["dateOfBirth"]);
       }

       //Step 5: required
       Person fromMap(dynamic jsonOrMap)=>Person.fromMap(jsonOrMap);
       }

       ////////////////////////////////// Use cas example: //////////////////////////////////

       Future<void> main() async {
         WidgetsFlutterBinding.ensureInitialized();

         /////////// DataAccess.instance /////////////

         //Show create table query of Person entity
         DataAccess.instance.showCreateTable(Person());

         //Check if the Person table exists in the database
         bool witnessPersTableExiste= await DataAccess.instance.checkIfEntityTableExists<Person>();

         //Insert a new person in Person table
         bool tInsert=await DataAccess.instance.insertObjet(Person(newKey,'KEBE','Birane',true,DateTime(2000,08,05)));

         //Insert a list of persons in Person table
         bool tInsertList=await DataAccess.instance.insertObjetList(
         <Person>[Person(newKey,'Mbaye','Aliou',true,DateTime(1999,05,01)),Person(newKey,'Cisse','Fatou',false,DateTime(2000,07,09))]
       );

       //Find a person
       Person birane=await DataAccess.instance.get<Person>(Person(),"firstName='Birane' and lastName='KEBE'");

       //Find all persons in Person table
       List<Person> Persons=await DataAccess.instance.getAll<Person>(Person());

       //Find men in Person table
       List<Person> men=await DataAccess.instance.getAllSorted<Person>(Person(),'sex=1');

       //Collect all first names
       List<String> firstNames=await DataAccess.instance.getAColumnFrom<String,Person>('firstName');

       //Collect all first names of female persons
       List<String> womensfirstName=await DataAccess.instance.getAColumnFrom<String,Person>('firstName',afterWhere: "sex=0");

       //Collect all Person's first and last 
       List<Map<String, Object>> firstNamesAndlastNames= await DataAccess.instance.getSommeColumnsFrom<Person>("firstName,lastName");

       //Collect all female's first and last names
       List<Map<String, Object>> firstNamesAndlastNamesFemmes= await DataAccess.instance.getSommeColumnsFrom<Person>("firstName,lastName",afterWhere: "sex=0");

       //Change Birane's first name to developer and last name KEBE in 2022
       bool witnessUpdatelastNameEtfirstName= await DataAccess.instance.updateSommeColumnsOf<Person>(['firstName','lastName'],['firstName','lastName'],['developper','2022','Birane','KEBE']);

       //Delete a Person with firstName Fatou
       bool witnessDelFatou= await DataAccess.instance.deleteObjet<Person>("firstName='Fatou'");

       //Count the number of Persons
       int nbPerson= await DataAccess.instance.countElementsOf<Person>();

       //Counts the lastNumber of Male Person
       int nbMen= await DataAccess.instance.countElementsOf<Person>(afterWhere: 'sex=1');

       //A top level function that dumps all data from database tables.
       await cleanAllTablesData();


        /////////// DiscData.instance /////////////

       //databases path
       String databases=await DiscData.instance.databasesPath;

       //files path
       String files=await DiscData.instance.filesPath;

       //files path
       String appFlutter=await DiscData.instance.rootPath;

       //Save text data to disc on files directory
       String fileName=await DiscData.instance.saveDataToDisc('contenu du fichier test.txt', DataType.text,takeThisName: 'test.txt');

       //Check if test.txt file exists
       bool witnessTestFileExiste=await DiscData.instance.checkFileExists('test.txt');

       //Read the contents of the test.txt file as string
       String readTest=await DiscData.instance.readFileAsString('test.txt');

       //Read the contents of the my_image.png file as base64 string 
       String readTestAsBase64=await DiscData.instance.readFileAsBase64('my_image.png');

       //Read the contents of the image.jpg file as Uint8List (bytes)
       Uint8List readTestBytes=await DiscData.instance.readFileAsBytes('my_image.png');

       //Read image.jpg file as Image
       Image readTestImage=await DiscData.instance.getImageFromDisc('my_image.png');

       //Read a data whitch name is store in columns of a table. Let's suppose that we have a table named Images whitch have
       //a colums named imageName and an image named image_test.jpg.
       //To load that image as bytes array :
       Uint8List readTestImageAsBytes=await DiscData.instance.getEntityFileOnDisc<Uint8List, Images>('imageName','imageID',1);

       runApp(Container()); 
    }
