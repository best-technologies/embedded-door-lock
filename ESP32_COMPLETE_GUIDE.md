# ESP32 Door Lock System - Complete Testing Guide

## 📌 Your ESP32 Pin Layout

### Side 1 (D0-D8 side):
```
D0  → GPIO 26
D1  → GPIO 22
D2  → GPIO 21
D3  → GPIO 0   (Boot button - be careful!)
D4  → GPIO 2   (Built-in LED)
D5  → GPIO 14
D6  → GPIO 12
D7  → GPIO 13
D8  → GPIO 15
RX  → GPIO 3
TX  → GPIO 1
3V  → 3.3V Power
G   → Ground
```

### Side 2 (A0/S pins side):
```
A0  → GPIO 36  (Input only - good for keypad)
G   → Ground
VV  → 3.3V Power
S3  → GPIO 10  (SPI - avoid)
S2  → GPIO 9   (SPI - avoid)
S1  → GPIO 8   (SPI - avoid)
SC  → GPIO 6   (SPI - avoid)
S0  → GPIO 7   (SPI - avoid)
SK  → GPIO 11  (SPI - avoid)
EN  → Enable pin (don't use)
RST → Reset pin (don't use)
G   → Ground
3V  → 3.3V Power
VIN → 5V Input
```

---

## 🔌 Pin Connections

### I2C LCD (4-Pin Module)
```
LCD VCC  → ESP32 3V (or 5V if available)
LCD GND  → ESP32 G
LCD SDA → ESP32 D7 (GPIO 13)
LCD SCL → ESP32 D6 (GPIO 12)
```

### RFID RC522
```
RC522 3.3V → ESP32 3V
RC522 GND  → ESP32 G
RC522 RST  → ESP32 D4 (GPIO 2)
RC522 SDA  → ESP32 D8 (GPIO 15)  (SDA = SS/CS pin)
RC522 MOSI → ESP32 D7 (GPIO 13) ⚠️ SHARED with LCD SDA
RC522 MISO → ESP32 D6 (GPIO 12) ⚠️ SHARED with LCD SCL
RC522 SCK  → ESP32 D5 (GPIO 14)
RC522 IRQ → Not connected (optional, not needed for basic operation)
```

### 4x4 Matrix Keypad

**⚠️ IMPORTANT: Your keypad has 8 wires (numbered 1-8) with no labels. You need to identify which are rows and which are columns first!**

**How to Identify Keypad Wires:**

Your keypad has 8 wires labeled 1-8. A 4x4 matrix keypad has:
- **4 Row wires** (one for each row of keys)
- **4 Column wires** (one for each column of keys)

**Method 1: Visual Inspection**
- Look at the keypad - wires 1-4 are usually rows, wires 5-8 are usually columns (or vice versa)
- Check if there's a pattern on the keypad PCB

**Method 2: Test with Multimeter (Best Method)**
1. Set multimeter to continuity/beep mode
2. Press a key (e.g., "1")
3. Test pairs of wires - when you find the pair that beeps when "1" is pressed, those are Row 1 and Col 1
4. Repeat for other keys to map all connections

**Method 3: Use Test Code (Easiest)**
Use the test code below to identify which wires are which by trying different combinations.

**Once Identified, Connect:**
```
Keypad Wire 1 (Row 1) → ESP32 A0 (GPIO 36)
Keypad Wire 2 (Row 2) → ESP32 D0 (GPIO 26)
Keypad Wire 3 (Row 3) → ESP32 D3 (GPIO 0)  ⚠️ Boot pin - use carefully
Keypad Wire 4 (Row 4) → ESP32 D2 (GPIO 21)

Keypad Wire 5 (Col 1) → ESP32 D1 (GPIO 22)
Keypad Wire 6 (Col 2) → ESP32 D5 (GPIO 14) ⚠️ SHARED with RFID SCK
Keypad Wire 7 (Col 3) → ESP32 D7 (GPIO 13) ⚠️ SHARED with LCD SDA/RFID MOSI
Keypad Wire 8 (Col 4) → ESP32 D8 (GPIO 15) ⚠️ SHARED with RFID SDA
```

**Note:** The wire order (which is row/column) depends on your specific keypad. Use the test code in Phase 3 to identify them!

### Relay Module (for door lock)
```
Relay VCC → ESP32 3V (or external 5V)
Relay GND → ESP32 G
Relay IN  → ESP32 D4 (GPIO 2) ⚠️ SHARED with RFID RST (use carefully)
```

**⚠️ Note:** Some pins are shared between components. This works because:
- I2C and SPI use different protocols
- Components are used at different times
- Keypad scanning is fast and won't interfere much

---

## 📚 Required Libraries

Install these in Arduino IDE (Sketch → Include Library → Manage Libraries):

1. **LiquidCrystal_I2C** (by Frank de Brabander)
2. **Keypad** (by Mark Stanley, Alexander Brevig)
3. **MFRC522** (by GithubCommunity)
4. **ArduinoJson** (by Benoit Blanchon) - Version 6.x

**Built-in libraries (no installation needed):**
- WiFi
- HTTPClient
- Wire
- SPI

---

## 🧪 Testing Phases

Follow these phases in order. Test each phase before moving to the next.

---

## PHASE 1: Test ESP32 Basic

**Purpose:** Verify ESP32 is working and serial communication is OK.

**Connections:** None needed - just upload and check Serial Monitor.

**Code:**
```cpp
// PHASE 1: Basic ESP32 Test
// Upload this and open Serial Monitor at 115200 baud

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("=================================");
  Serial.println("ESP32 Door Lock System - Test");
  Serial.println("=================================");
  Serial.println("ESP32 is running!");
  Serial.print("Chip Model: ");
  Serial.println(ESP.getChipModel());
  Serial.print("Chip Revision: ");
  Serial.println(ESP.getChipRevision());
  Serial.print("CPU Frequency: ");
  Serial.print(ESP.getCpuFreqMHz());
  Serial.println(" MHz");
  Serial.print("Free Heap: ");
  Serial.print(ESP.getFreeHeap());
  Serial.println(" bytes");
  Serial.print("Flash Size: ");
  Serial.print(ESP.getFlashChipSize() / 1024 / 1024);
  Serial.println(" MB");
  Serial.println("=================================");
  Serial.println("If you see this, ESP32 is working!");
}

void loop() {
  Serial.println("ESP32 is alive! Time: " + String(millis() / 1000) + " seconds");
  delay(2000);
}
```

**Expected Output:**
- Serial Monitor shows chip info
- "ESP32 is alive!" message every 2 seconds

**✅ Success:** If you see the messages, ESP32 is working!

---

## PHASE 2: Test LCD (4-Pin I2C)

**Purpose:** Test the LCD display.

**Connections:**
- LCD VCC → ESP32 3V
- LCD GND → ESP32 G
- LCD SDA → ESP32 D7 (GPIO 13)
- LCD SCL → ESP32 D6 (GPIO 12)

**Code:**
```cpp
// PHASE 2: LCD Test (4-Pin I2C)
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// I2C pins
#define I2C_SDA 13  // D7
#define I2C_SCL 12  // D6

// LCD address - try 0x27 first, if not working try 0x3F
LiquidCrystal_I2C lcd(0x27, 16, 2); // Address, columns, rows

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("Initializing LCD...");
  
  // Initialize I2C with custom pins
  Wire.begin(I2C_SDA, I2C_SCL);
  
  // Initialize LCD
  lcd.init();
  lcd.backlight();
  
  // Display startup message
  lcd.setCursor(0, 0);
  lcd.print("ESP32 Door Lock");
  lcd.setCursor(0, 1);
  lcd.print("LCD Test OK!");
  
  Serial.println("LCD initialized!");
  Serial.println("If you see text on LCD, it's working!");
  delay(2000);
  
  lcd.clear();
}

void loop() {
  // Display scrolling text
  lcd.setCursor(0, 0);
  lcd.print("Time: ");
  lcd.print(millis() / 1000);
  lcd.print(" sec    ");
  
  lcd.setCursor(0, 1);
  lcd.print("Status: Running");
  
  Serial.println("LCD updating... Time: " + String(millis() / 1000));
  delay(1000);
}
```

**Troubleshooting:**
- If LCD doesn't show anything, try address 0x3F instead of 0x27
- Check connections (SDA to D7, SCL to D6)
- Make sure LCD has power (VCC to 3V)

**✅ Success:** If you see text on LCD, it's working!

---

## PHASE 2.5: Identify Keypad Wires (Do This First!)

**Purpose:** If your keypad wires aren't labeled, use this code to identify which wires are rows and which are columns.

**Quick Method:**
1. Connect wires 1-4 to ESP32 pins: A0 (GPIO 36), D0 (GPIO 26), D3 (GPIO 0), D2 (GPIO 21)
2. Connect wires 5-8 to ESP32 pins: D1 (GPIO 22), D5 (GPIO 14), D7 (GPIO 13), D8 (GPIO 15)
3. Upload the test code below
4. Press keys on the keypad and check Serial Monitor
5. If keys work correctly, you're done! If not, swap the row/column assignments

**Code:**
```cpp
// KEYPAD WIRE IDENTIFICATION TEST
// Connect wires 1-8 to ESP32 pins as shown below
// Then press keys and see what appears in Serial Monitor

#include <Keypad.h>

const byte ROWS = 4;
const byte COLS = 4;

char keys[ROWS][COLS] = {
  {'1', '2', '3', 'A'},
  {'4', '5', '6', 'B'},
  {'7', '8', '9', 'C'},
  {'*', '0', '#', 'D'}
};

// Try this first: wires 1-4 as rows, wires 5-8 as columns
byte rowPins[ROWS] = {36, 26, 0, 21};  // Wires 1, 2, 3, 4
byte colPins[COLS] = {22, 14, 13, 15}; // Wires 5, 6, 7, 8

Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("=================================");
  Serial.println("Keypad Wire Identification Test");
  Serial.println("=================================");
  Serial.println("Press keys on your keypad...");
  Serial.println("If keys match (1 shows '1', etc.), wiring is correct!");
  Serial.println("If keys are wrong, swap row/column assignments");
  Serial.println("=================================");
}

void loop() {
  char key = keypad.getKey();
  
  if (key) {
    Serial.print("Key Pressed: ");
    Serial.println(key);
    
    // Test: Press '1' - if it shows '1', wiring is correct
    // If pressing '1' shows something else, you need to swap rows/columns
  }
  
  delay(10);
}
```

**If keys don't match:**
- Swap row and column pins in the code
- Or physically swap wires 1-4 with wires 5-8
- Keep testing until pressing "1" shows "1", "2" shows "2", etc.

---

## PHASE 3: Test Keypad

**Purpose:** Test the 4x4 keypad (1-9, A, B, C, D, #, 0, *).

**Connections (After identifying wires in Phase 2.5):**
```
Keypad Row 1 → ESP32 A0 (GPIO 36)
Keypad Row 2 → ESP32 D0 (GPIO 26)
Keypad Row 3 → ESP32 D3 (GPIO 0)
Keypad Row 4 → ESP32 D2 (GPIO 21)

Keypad Col 1 → ESP32 D1 (GPIO 22)
Keypad Col 2 → ESP32 D5 (GPIO 14)
Keypad Col 3 → ESP32 D7 (GPIO 13)
Keypad Col 4 → ESP32 D8 (GPIO 15)
```

**Code:**
```cpp
// PHASE 3: Keypad Test
#include <Keypad.h>

// Keypad layout
const byte ROWS = 4;
const byte COLS = 4;

char keys[ROWS][COLS] = {
  {'1', '2', '3', 'A'},
  {'4', '5', '6', 'B'},
  {'7', '8', '9', 'C'},
  {'*', '0', '#', 'D'}
};

// Row pins
byte rowPins[ROWS] = {36, 26, 0, 21};  // A0, D0, D3, D2
// Column pins
byte colPins[COLS] = {22, 14, 13, 15}; // D1, D5, D7, D8

Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("=================================");
  Serial.println("Keypad Test Started");
  Serial.println("Press any key on the keypad...");
  Serial.println("Keys: 1-9, 0, A, B, C, D, *, #");
  Serial.println("=================================");
}

void loop() {
  char key = keypad.getKey();
  
  if (key) {
    Serial.print("Key Pressed: ");
    Serial.println(key);
    
    // Test different key types
    if (key >= '0' && key <= '9') {
      Serial.println("  -> Number key");
    } else if (key >= 'A' && key <= 'D') {
      Serial.println("  -> Letter key");
    } else if (key == '*') {
      Serial.println("  -> Star key");
    } else if (key == '#') {
      Serial.println("  -> Hash key");
    }
    
    Serial.println("---");
  }
  
  delay(10);
}
```

**Troubleshooting:**
- If no keys detected, check all 8 connections (4 rows + 4 columns)
- Make sure keypad is properly connected
- Try pressing keys firmly

**✅ Success:** If Serial Monitor shows keys when pressed, keypad is working!

---

## PHASE 4: Test RFID Scanner

**Purpose:** Test RFID RC522 reader.

**Connections:**
```
RC522 3.3V → ESP32 3V
RC522 GND  → ESP32 G
RC522 RST  → ESP32 D4 (GPIO 2)
RC522 SDA  → ESP32 D8 (GPIO 15)  (SDA = SS/CS pin)
RC522 MOSI → ESP32 D7 (GPIO 13)
RC522 MISO → ESP32 D6 (GPIO 12)
RC522 SCK  → ESP32 D5 (GPIO 14)
RC522 IRQ → Not connected (optional)
```

**Code:**
```cpp
// PHASE 4: RFID Scanner Test
#include <SPI.h>
#include <MFRC522.h>

#define RST_PIN  2   // D4 (GPIO 2)
#define SS_PIN   15  // D8 (GPIO 15)

MFRC522 mfrc522(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("=================================");
  Serial.println("RFID Reader Test");
  Serial.println("=================================");
  
  // Initialize SPI
  SPI.begin();
  
  // Initialize RFID reader
  mfrc522.PCD_Init();
  
  // Show reader details
  Serial.println("RFID Reader initialized!");
  mfrc522.PCD_DumpVersionToSerial();
  Serial.println("Place RFID card/tag near reader...");
  Serial.println();
}

void loop() {
  // Look for new cards
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return;
  }
  
  // Select one of the cards
  if (!mfrc522.PICC_ReadCardSerial()) {
    return;
  }
  
  // Card detected!
  Serial.println("=================================");
  Serial.println("Card Detected!");
  Serial.print("Card UID (Hex): ");
  
  // Print UID in hex format
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) Serial.print("0");
    Serial.print(mfrc522.uid.uidByte[i], HEX);
    Serial.print(" ");
  }
  Serial.println();
  
  // Print UID as string (for API)
  String uidString = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) uidString += "0";
    uidString += String(mfrc522.uid.uidByte[i], HEX);
  }
  uidString.toUpperCase();
  
  Serial.print("UID (String): ");
  Serial.println(uidString);
  Serial.println("=================================");
  
  // Halt PICC
  mfrc522.PICC_HaltA();
  delay(1000);
}
```

**Troubleshooting:**
- If no cards detected, check SPI connections
- Make sure RC522 has power (3V)
- Try moving card closer to reader
- Check that SS pin is connected to D8

**✅ Success:** If Serial Monitor shows card UID when you place a card, RFID is working!

---

## PHASE 5: Test WiFi Connection

**Purpose:** Test WiFi connectivity.

**Connections:** None needed - WiFi is built into ESP32.

**Code:**
```cpp
// PHASE 5: WiFi Connection Test
#include <WiFi.h>

// ⚠️ CHANGE THESE TO YOUR WIFI CREDENTIALS
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("=================================");
  Serial.println("WiFi Connection Test");
  Serial.println("=================================");
  
  // Connect to WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  Serial.print("Connecting to WiFi");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi Connected!");
    Serial.print("SSID: ");
    Serial.println(ssid);
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal Strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    Serial.print("MAC Address: ");
    Serial.println(WiFi.macAddress());
    Serial.println("=================================");
  } else {
    Serial.println("WiFi Connection Failed!");
    Serial.println("Check your SSID and password");
  }
}

void loop() {
  // Check WiFi status every 10 seconds
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi still connected. IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("WiFi disconnected! Reconnecting...");
    WiFi.begin(ssid, password);
  }
  
  delay(10000);
}
```

**⚠️ Important:** Change `YOUR_WIFI_SSID` and `YOUR_WIFI_PASSWORD` to your actual WiFi credentials!

**✅ Success:** If Serial Monitor shows IP address, WiFi is working!

---

## PHASE 6: Test API Health Check

**Purpose:** Test connection to your backend API.

**Connections:** None needed - uses WiFi.

**Code:**
```cpp
// PHASE 6: API Health Check Test
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ⚠️ CHANGE THESE TO YOUR VALUES
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* apiBaseUrl = "http://your-backend-url.com"; // e.g., "http://192.168.1.100:3000"

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("=================================");
  Serial.println("API Health Check Test");
  Serial.println("=================================");
  
  // Connect to WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  Serial.print("Connecting to WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi Connection Failed!");
    return;
  }
  
  Serial.print("WiFi Connected! IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();
  
  // Test health endpoint
  testHealthEndpoint();
}

void loop() {
  // Test health endpoint every 5 seconds
  delay(5000);
  testHealthEndpoint();
}

bool testHealthEndpoint() {
  HTTPClient http;
  String url = String(apiBaseUrl) + "/health";
  
  Serial.print("Testing: ");
  Serial.println(url);
  
  http.begin(url);
  http.setTimeout(5000);
  
  int httpCode = http.GET();
  
  if (httpCode > 0) {
    Serial.print("HTTP Response Code: ");
    Serial.println(httpCode);
    
    if (httpCode == 200) {
      String payload = http.getString();
      Serial.println("Response:");
      Serial.println(payload);
      
      // Parse JSON response
      DynamicJsonDocument doc(1024);
      DeserializationError error = deserializeJson(doc, payload);
      
      if (!error) {
        Serial.println("\nParsed Response:");
        Serial.print("  Status: ");
        Serial.println(doc["status"].as<String>());
        Serial.print("  Database: ");
        Serial.println(doc["database"].as<String>());
        Serial.print("  Environment: ");
        Serial.println(doc["environment"].as<String>());
        Serial.println("=================================");
        http.end();
        return true;
      } else {
        Serial.print("JSON Parse Error: ");
        Serial.println(error.c_str());
      }
    }
  } else {
    Serial.print("HTTP Request Failed: ");
    Serial.println(http.errorToString(httpCode));
  }
  
  http.end();
  return false;
}
```

**⚠️ Important:** 
- Change `YOUR_WIFI_SSID` and `YOUR_WIFI_PASSWORD`
- Change `apiBaseUrl` to your backend URL (e.g., "http://192.168.1.100:3000" for local, or your deployed URL)

**✅ Success:** If Serial Monitor shows "Status: ok" and "Database: connected", API is working!

---

## PHASE 7: Test All Hardware Together

**Purpose:** Test LCD, Keypad, and RFID together (without WiFi/API).

**Connections:** Connect all components as described in "Pin Connections" section above.

**Code:**
```cpp
// PHASE 7: Test All Hardware Together
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Keypad.h>
#include <SPI.h>
#include <MFRC522.h>

// ==================== LCD SETUP ====================
#define I2C_SDA 13  // D7
#define I2C_SCL 12  // D6
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
byte rowPins[ROWS] = {36, 26, 0, 21};  // A0, D0, D3, D2
byte colPins[COLS] = {22, 14, 13, 15}; // D1, D5, D7, D8
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

// ==================== RFID SETUP ====================
#define RST_PIN  2   // D4
#define SS_PIN   15  // D8
MFRC522 mfrc522(SS_PIN, RST_PIN);

// ==================== RELAY SETUP ====================
#define RELAY_PIN 2  // D4 (shared with RFID RST - use carefully)

unsigned long lastRFIDCheck = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("=================================");
  Serial.println("All Hardware Test Started");
  Serial.println("=================================");
  
  // Initialize LCD
  Wire.begin(I2C_SDA, I2C_SCL);
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("System Starting...");
  delay(1000);
  
  // Initialize RFID
  SPI.begin();
  mfrc522.PCD_Init();
  
  // Initialize Relay
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
  
  // Display ready message
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("System Ready!");
  lcd.setCursor(0, 1);
  lcd.print("Test Mode");
  
  Serial.println("All components initialized!");
  delay(2000);
}

void loop() {
  // Check RFID every 500ms
  if (millis() - lastRFIDCheck > 500) {
    lastRFIDCheck = millis();
    
    if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
      String uid = "";
      for (byte i = 0; i < mfrc522.uid.size; i++) {
        if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";
        uid += String(mfrc522.uid.uidByte[i], HEX);
      }
      uid.toUpperCase();
      
      Serial.print("RFID Detected: ");
      Serial.println(uid);
      
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("RFID: ");
      lcd.print(uid.substring(0, 8));
      lcd.setCursor(0, 1);
      lcd.print(uid.substring(8));
      
      // Test relay (unlock for 2 seconds)
      digitalWrite(RELAY_PIN, HIGH);
      delay(2000);
      digitalWrite(RELAY_PIN, LOW);
      
      mfrc522.PICC_HaltA();
      delay(1000);
    }
  }
  
  // Check Keypad
  char key = keypad.getKey();
  if (key) {
    Serial.print("Keypad: ");
    Serial.println(key);
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Keypad: ");
    lcd.print(key);
    lcd.setCursor(0, 1);
    lcd.print("Press more...");
    
    delay(500);
  }
  
  // Update LCD status
  static unsigned long lastStatusUpdate = 0;
  if (millis() - lastStatusUpdate > 5000) {
    lastStatusUpdate = millis();
    if (!key && !mfrc522.PICC_IsNewCardPresent()) {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Waiting...");
      lcd.setCursor(0, 1);
      lcd.print("Uptime: ");
      lcd.print(millis() / 1000);
      lcd.print("s");
    }
  }
  
  delay(10);
}
```

**✅ Success:** If LCD shows messages, keypad inputs work, and RFID cards are detected, all hardware is working!

---

## PHASE 8: Final Complete System

**Purpose:** Complete door lock system with WiFi, API integration, and all components.

**Connections:** Connect all components as described in "Pin Connections" section above.

**Code:**
```cpp
// PHASE 8: Complete Door Lock System
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Keypad.h>
#include <SPI.h>
#include <MFRC522.h>

// ==================== CONFIGURATION ====================
// ⚠️ CHANGE THESE TO YOUR VALUES
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* apiBaseUrl = "http://your-backend-url.com"; // e.g., "http://192.168.1.100:3000"
const char* deviceId = "DOOR-001"; // Your device ID

// ==================== LCD SETUP ====================
#define I2C_SDA 13  // D7
#define I2C_SCL 12  // D6
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
byte rowPins[ROWS] = {36, 26, 0, 21};  // A0, D0, D3, D2
byte colPins[COLS] = {22, 14, 13, 15}; // D1, D5, D7, D8
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

String enteredPin = "";
unsigned long pinEntryStart = 0;
const unsigned long PIN_TIMEOUT = 10000; // 10 seconds

// ==================== RFID SETUP ====================
#define RST_PIN  2   // D4
#define SS_PIN   15  // D8
MFRC522 mfrc522(SS_PIN, RST_PIN);
unsigned long lastRFIDCheck = 0;

// ==================== RELAY SETUP ====================
#define RELAY_PIN 2  // D4 (shared with RFID RST)
const unsigned long UNLOCK_DURATION = 3000; // 3 seconds

// ==================== STATE MANAGEMENT ====================
enum SystemState {
  STATE_IDLE,
  STATE_PROCESSING,
  STATE_GRANTED,
  STATE_DENIED,
  STATE_ERROR
};

SystemState currentState = STATE_IDLE;
unsigned long stateChangeTime = 0;
const unsigned long STATE_DISPLAY_TIME = 3000;

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("=================================");
  Serial.println("ESP32 Door Lock System");
  Serial.println("=================================");
  
  // Initialize LCD
  Wire.begin(I2C_SDA, I2C_SCL);
  lcd.init();
  lcd.backlight();
  displayMessage("Initializing...", "Please wait");
  
  // Initialize RFID
  SPI.begin();
  mfrc522.PCD_Init();
  
  // Initialize Relay
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
  
  // Connect to WiFi
  connectToWiFi();
  
  // Test API connection
  if (testHealthEndpoint()) {
    displayMessage("API Connected", "System Ready");
    delay(2000);
  } else {
    displayMessage("API Error", "Check connection");
    delay(3000);
  }
  
  displayMessage("System Ready", "Waiting...");
  Serial.println("System initialized successfully!");
}

// ==================== MAIN LOOP ====================
void loop() {
  // Handle state display timeout
  if (currentState != STATE_IDLE && 
      millis() - stateChangeTime > STATE_DISPLAY_TIME) {
    currentState = STATE_IDLE;
    displayMessage("System Ready", "Waiting...");
  }
  
  // Check RFID
  checkRFID();
  
  // Check Keypad
  checkKeypad();
  
  delay(50);
}

// ==================== WIFI CONNECTION ====================
void connectToWiFi() {
  displayMessage("Connecting WiFi", ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("WiFi Connected! IP: ");
    Serial.println(WiFi.localIP());
    displayMessage("WiFi Connected", WiFi.localIP().toString());
    delay(2000);
  } else {
    Serial.println("WiFi Connection Failed!");
    displayMessage("WiFi Failed", "Retrying...");
  }
}

// ==================== API HEALTH CHECK ====================
bool testHealthEndpoint() {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }
  
  HTTPClient http;
  String url = String(apiBaseUrl) + "/health";
  
  http.begin(url);
  http.setTimeout(5000);
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    Serial.print("Health Check: ");
    Serial.println(payload);
    
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      String status = doc["status"].as<String>();
      String database = doc["database"].as<String>();
      Serial.print("Status: ");
      Serial.println(status);
      Serial.print("Database: ");
      Serial.println(database);
      http.end();
      return true;
    }
  } else {
    Serial.print("Health Check Failed: ");
    Serial.println(httpCode);
  }
  
  http.end();
  return false;
}

// ==================== RFID CHECK ====================
void checkRFID() {
  if (millis() - lastRFIDCheck < 500) return;
  lastRFIDCheck = millis();
  
  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;
  
  // Get RFID UID
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  
  Serial.print("RFID Scanned: ");
  Serial.println(uid);
  
  displayMessage("RFID Detected", "Processing...");
  currentState = STATE_PROCESSING;
  stateChangeTime = millis();
  
  // Check with API if RFID is authorized
  // Note: You may need to implement a check endpoint or sync users locally
  // For now, we'll log the attempt and you can implement validation
  bool authorized = checkAccessWithAPI("rfid", uid, "");
  
  if (authorized) {
    grantAccess("rfid", uid);
  } else {
    denyAccess("RFID not authorized");
  }
  
  mfrc522.PICC_HaltA();
  delay(1000);
}

// ==================== KEYPAD CHECK ====================
void checkKeypad() {
  char key = keypad.getKey();
  
  if (key) {
    if (key == '#') {
      // Submit PIN
      if (enteredPin.length() >= 4) {
        Serial.print("PIN Entered: ");
        Serial.println(enteredPin);
        
        displayMessage("PIN Entered", "Processing...");
        currentState = STATE_PROCESSING;
        stateChangeTime = millis();
        
        // Check with API
        // Note: You may need to implement a check endpoint or sync users locally
        bool authorized = checkAccessWithAPI("keypad", "", enteredPin);
        
        if (authorized) {
          grantAccess("keypad", enteredPin);
        } else {
          denyAccess("Invalid PIN");
        }
        
        enteredPin = "";
        pinEntryStart = 0;
      }
    } else if (key == '*') {
      // Clear PIN
      enteredPin = "";
      pinEntryStart = 0;
      displayMessage("PIN Cleared", "Enter PIN...");
    } else if (key >= '0' && key <= '9') {
      // Add digit to PIN
      if (enteredPin.length() < 10) {
        enteredPin += key;
        displayMessage("PIN: " + enteredPin, "Press # to submit");
        pinEntryStart = millis();
      }
    }
  }
  
  // Check PIN timeout
  if (enteredPin.length() > 0 && 
      millis() - pinEntryStart > PIN_TIMEOUT) {
    enteredPin = "";
    displayMessage("PIN Timeout", "Try again");
  }
}

// ==================== API ACCESS CHECK ====================
// NOTE: This is a placeholder. You have two options:
// 1. Implement an access check endpoint in your backend
// 2. Sync users from API and check locally (better for offline capability)
// For now, this function always returns false - implement your logic here
bool checkAccessWithAPI(String method, String rfidUid, String pin) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected - cannot check access");
    return false;
  }
  
  // TODO: Implement your access check logic here
  // Option 1: Call a check endpoint (if you create one in backend)
  // Option 2: Sync users and check locally
  
  // For demonstration, we'll just return false
  // You should implement actual validation logic
  Serial.println("Access check not implemented yet");
  return false;
  
  // Example implementation (if you create a check endpoint):
  /*
  HTTPClient http;
  String url = String(apiBaseUrl) + "/api/v1/access/check";
  
  http.begin(url);
  http.setTimeout(5000);
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(512);
  doc["deviceId"] = deviceId;
  doc["method"] = method;
  
  if (method == "rfid" && rfidUid.length() > 0) {
    doc["rfidUid"] = rfidUid;
  } else if (method == "keypad" && pin.length() > 0) {
    doc["keypadPin"] = pin;
  }
  
  String payload;
  serializeJson(doc, payload);
  
  int httpCode = http.POST(payload);
  bool authorized = false;
  
  if (httpCode == 200) {
    String response = http.getString();
    DynamicJsonDocument responseDoc(512);
    DeserializationError error = deserializeJson(responseDoc, response);
    
    if (!error && responseDoc["authorized"].as<bool>()) {
      authorized = true;
    }
  }
  
  http.end();
  return authorized;
  */
}

// ==================== ACCESS CONTROL ====================
void grantAccess(String method, String identifier) {
  Serial.print("Access GRANTED via ");
  Serial.print(method);
  Serial.print(": ");
  Serial.println(identifier);
  
  displayMessage("Access Granted", "Door Unlocked");
  currentState = STATE_GRANTED;
  stateChangeTime = millis();
  
  // Activate relay (unlock door)
  digitalWrite(RELAY_PIN, HIGH);
  delay(UNLOCK_DURATION);
  digitalWrite(RELAY_PIN, LOW);
  
  // Log access to API
  logAccessToAPI(method, identifier, "success");
}

void denyAccess(String reason) {
  Serial.print("Access DENIED: ");
  Serial.println(reason);
  
  displayMessage("Access Denied", reason);
  currentState = STATE_DENIED;
  stateChangeTime = millis();
  
  // Log failed access to API
  logAccessToAPI("", "", "failed");
}

// ==================== LOG ACCESS TO API ====================
void logAccessToAPI(String method, String identifier, String status) {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  HTTPClient http;
  String url = String(apiBaseUrl) + "/api/v1/access/logs";
  
  http.begin(url);
  http.setTimeout(5000);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload according to your backend API
  DynamicJsonDocument doc(1024);
  doc["deviceId"] = deviceId;
  doc["method"] = method;
  doc["status"] = status;
  
  // Add userId if available (you'll need to get this from your check function)
  // doc["userId"] = userId; // Add this when you implement user lookup
  
  if (method == "rfid" && identifier.length() > 0) {
    doc["rfidUid"] = identifier;
  } else if (method == "keypad" && identifier.length() > 0) {
    doc["keypadPin"] = identifier;
  }
  
  // Add timestamp (ISO format)
  unsigned long seconds = millis() / 1000;
  doc["timestamp"] = "2025-11-08T" + String(seconds / 3600) + ":" + 
                     String((seconds % 3600) / 60) + ":" + 
                     String(seconds % 60) + "Z";
  
  String payload;
  serializeJson(doc, payload);
  
  int httpCode = http.POST(payload);
  
  if (httpCode > 0) {
    Serial.print("Access logged: ");
    Serial.println(httpCode);
  } else {
    Serial.print("Log failed: ");
    Serial.println(http.errorToString(httpCode));
  }
  
  http.end();
}

// ==================== UTILITY FUNCTIONS ====================
void displayMessage(String line1, String line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1.substring(0, 16));
  lcd.setCursor(0, 1);
  lcd.print(line2.substring(0, 16));
}
```

**⚠️ Important Configuration:**
1. Change `YOUR_WIFI_SSID` and `YOUR_WIFI_PASSWORD`
2. Change `apiBaseUrl` to your backend URL (e.g., "http://192.168.1.100:3000" for local)
3. Change `deviceId` to your device ID (e.g., "DOOR-001")
4. Adjust `UNLOCK_DURATION` if needed (currently 3 seconds)

**⚠️ Important Note:**
The `checkAccessWithAPI()` function is a placeholder. You need to implement one of these:
1. **Create an access check endpoint** in your backend that validates RFID/PIN
2. **Sync users from API** and check locally (better for offline capability)

For now, the system will log all access attempts to `/api/v1/access/logs` but won't grant/deny access automatically. Implement the check logic based on your backend API structure.

**✅ Success:** If the system connects to WiFi, logs to API, and responds to RFID/keypad inputs, the hardware integration is working!

---

## 📝 Installation Steps

1. **Install Arduino IDE** (if not already installed)
   - Download from: https://www.arduino.cc/en/software

2. **Install ESP32 Board Support**
   - File → Preferences → Additional Board Manager URLs
   - Add: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Tools → Board → Boards Manager → Search "ESP32" → Install

3. **Install Required Libraries**
   - Sketch → Include Library → Manage Libraries
   - Search and install:
     - LiquidCrystal_I2C
     - Keypad
     - MFRC522
     - ArduinoJson (Version 6.x)

4. **Select Correct Board (IMPORTANT!)**
   
   **⚠️ Your board is NOT "Arduino Nano ESP32"!**
   
   Based on your pin layout (D0-D8, A0), you likely have:
   - **ESP32 DevKit** or
   - **NodeMCU-32S** or  
   - **ESP32-WROOM-32 DevKit**
   
   **Correct Board Selection:**
   - Tools → Board → **ESP32 Arduino** → **ESP32 Dev Module**
   - OR: Tools → Board → **ESP32 Arduino** → **NodeMCU-32S** (if available)
   
   **If you don't see ESP32 boards:**
   1. File → Preferences → Additional Board Manager URLs
   2. Add: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   3. Tools → Board → Boards Manager
   4. Search "ESP32" → Install "esp32 by Espressif Systems"
   5. Wait for installation to complete
   6. Then select: Tools → Board → **ESP32 Dev Module**

5. **Upload Settings**
   - Tools → Board → **ESP32 Dev Module** (NOT Arduino Nano ESP32!)
   - Tools → Upload Speed → **115200** (or 921600 if 115200 is too slow)
   - Tools → Port → Select your ESP32 port (e.g., /dev/cu.usbserial-xxx on Mac, COMx on Windows)
   - Tools → CPU Frequency → **240MHz (WiFi/BT)**
   - Tools → Flash Frequency → **80MHz**
   - Tools → Flash Size → **4MB (32Mb)**
   - Tools → Partition Scheme → **Default 4MB with spiffs**
   - Tools → Core Debug Level → **None** (or Info for debugging)

6. **Upload Code**
   - Click Upload button (or Ctrl+U / Cmd+U)
   - Hold BOOT button on ESP32 if upload fails
   - Monitor Serial: Tools → Serial Monitor (115200 baud)

---

## 🔧 Troubleshooting

### LCD not working
- Try address 0x3F instead of 0x27
- Check SDA/SCL connections (D7/D6)
- Verify power connection (3V)

### Keypad not responding
- Check all 8 connections (4 rows + 4 columns)
- Make sure pins match the code
- Try pressing keys more firmly

### RFID not reading
- Check SPI connections
- Verify power (3V)
- Move card closer to reader
- Check SS pin connection (D8)

### WiFi issues
- Verify SSID and password
- Check signal strength
- Make sure 2.4GHz network (ESP32 doesn't support 5GHz)

### API errors
- Check backend URL is correct
- Verify backend is running
- Check network connectivity
- Look at Serial Monitor for error messages

---

## ✅ Testing Checklist

- [ ] Phase 1: ESP32 basic test works
- [ ] Phase 2: LCD displays text
- [ ] Phase 3: Keypad detects all keys
- [ ] Phase 4: RFID reads cards
- [ ] Phase 5: WiFi connects
- [ ] Phase 6: API health check works
- [ ] Phase 7: All hardware works together
- [ ] Phase 8: Complete system works with API

---

## 🎯 Next Steps

After all tests pass:
1. Update API endpoints in Phase 8 code to match your backend
2. Implement user authentication logic
3. Add fingerprint scanner (if needed)
4. Test with real users and RFID cards
5. Deploy and monitor

Good luck with your project! 🚀

