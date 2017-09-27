void setup() {
  Serial.begin(115200);
  Serial.setTimeout(0);

  //Add following for Uno
  while(!Serial){};
  Serial.println("ready");

  pinMode(2, INPUT);
}

void loop() {
    
    if(Serial.available() > 0){
      printIntData(); // demo for recive and print int input.//
    }
    
    delay(80);

}

void printIntData(){
      
      if( digitalRead(2) == HIGH ){
        Serial.print("1");
      }
        else{
        Serial.print("0");
      }
      
      
      Serial.print('\n');

}

