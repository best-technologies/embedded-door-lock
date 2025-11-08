// ESP32 NodeMCU-Style Board - Door Lock System
// Pin assignments for D0-D8 labeled ESP32 board

// ==================== PIN DEFINITIONS ====================
// I2C LCD (4-Pin)
#define LCD_SDA 13  // D7 (GPIO 13)
#define LCD_SCL 12  // D6 (GPIO 12)

// RFID RC522
#define RFID_RST 2   // D4 (GPIO 2)
#define RFID_SS 15   // D8 (GPIO 15)
#define RFID_MOSI 13 // D7 (GPIO 13) - SHARED with LCD SDA
#define RFID_MISO 12 // D6 (GPIO 12) - SHARED with LCD SCL
#define RFID_SCK 14  // D5 (GPIO 14)

// Keypad (4x4 Matrix)
// Rows
#define KEYPAD_ROW1 36 // A0 (GPIO 36) - Input only
#define KEYPAD_ROW2 26 // D0 (GPIO 26)
#define KEYPAD_ROW3 0  // D3 (GPIO 0) - Boot pin, be careful!
#define KEYPAD_ROW4 21 // D2 (GPIO 21) - Alternative if not using for I2C

// Columns
#define KEYPAD_COL1 22 // D1 (GPIO 22) - Alternative if not using for I2C
#define KEYPAD_COL2 14 // D5 (GPIO 14) - SHARED with RFID SCK
#define KEYPAD_COL3 13 // D7 (GPIO 13) - SHARED with LCD SDA/RFID MOSI
#define KEYPAD_COL4 15 // D8 (GPIO 15) - SHARED with RFID SS

// Relay
#define RELAY_PIN 2 // D4 (GPIO 2) - SHARED with RFID RST

// Fingerprint (Optional - skip if you need more pins)
#define FINGERPRINT_RX 3 // RX (GPIO 3) - Serial2 RX
#define FINGERPRINT_TX 1 // TX (GPIO 1) - Serial2 TX (conflicts with USB Serial)

// ==================== INCLUDES ====================
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Keypad.h>
#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ==================== LCD SETUP ====================
LiquidCrystal_I2C lcd(0x27, 16, 2); // Try 0x3F if 0x27 doesn't work

// ==================== KEYPAD SETUP ====================
const byte ROWS = 4;
const byte COLS = 4;
char keys[ROWS][COLS] = {
  {'1', '2', '3', 'A'},
  {'4', '5', '6', 'B'},
  {'7', '8', '9', 'C'},
  {'*', '0', '#', 'D'}
};
byte rowPins[ROWS] = {KEYPAD_ROW1, KEYPAD_ROW2, KEYPAD_ROW3, KEYPAD_ROW4};
byte colPins[COLS] = {KEYPAD_COL1, KEYPAD_COL2, KEYPAD_COL3, KEYPAD_COL4};
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

// ==================== RFID SETUP ====================
MFRC522 mfrc522(RFID_SS, RFID_RST);

// ==================== CONFIGURATION ====================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* apiBaseUrl = "http://your-backend-url.com";
const char* deviceId = "DOOR-001";

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("=================================");
  Serial.println("ESP32 NodeMCU Door Lock System");
  Serial.println("=================================");
  
  // Initialize I2C with custom pins
  Wire.begin(LCD_SDA, LCD_SCL);
  
  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Initializing...");
  
  // Initialize RFID
  SPI.begin();
  mfrc522.PCD_Init();
  
  // Initialize Relay
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
  
  // Test LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("LCD Test OK!");
  delay(2000);
  
  // Connect WiFi
  connectToWiFi();
  
  // Test API
  if (testHealthEndpoint()) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("API Connected!");
    delay(2000);
  }
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("System Ready");
  lcd.setCursor(0, 1);
  lcd.print("Waiting...");
  
  Serial.println("System initialized!");
}

// ==================== MAIN LOOP ====================
void loop() {
  // Check RFID
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";
      uid += String(mfrc522.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();
    
    Serial.print("RFID: ");
    Serial.println(uid);
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("RFID: ");
    lcd.print(uid.substring(0, 8));
    lcd.setCursor(0, 1);
    lcd.print(uid.substring(8));
    
    // Test relay
    digitalWrite(RELAY_PIN, HIGH);
    delay(2000);
    digitalWrite(RELAY_PIN, LOW);
    
    mfrc522.PICC_HaltA();
    delay(1000);
  }
  
  // Check Keypad
  char key = keypad.getKey();
  if (key) {
    Serial.print("Key: ");
    Serial.println(key);
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Keypad: ");
    lcd.print(key);
    delay(1000);
  }
  
  delay(100);
}

// ==================== WIFI CONNECTION ====================
void connectToWiFi() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("WiFi IP: ");
    Serial.println(WiFi.localIP());
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP().toString());
    delay(2000);
  } else {
    Serial.println("WiFi Failed!");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Failed");
  }
}

// ==================== API HEALTH CHECK ====================
bool testHealthEndpoint() {
  HTTPClient http;
  String url = String(apiBaseUrl) + "/health";
  
  http.begin(url);
  http.setTimeout(5000);
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    Serial.print("Health: ");
    Serial.println(payload);
    http.end();
    return true;
  } else {
    Serial.print("Health Check Failed: ");
    Serial.println(httpCode);
    http.end();
    return false;
  }
}

