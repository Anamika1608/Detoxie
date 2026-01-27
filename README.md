# Detoxie App

Detoxie is a React Native application that integrates with Android's **Accessibility Service** to detect and track user activity (such as time spent on Reels/Explore). It uses a **custom Native Module** to bridge communication between the native Android code and the React Native (JS/TS) layer.

live on google play - https://play.google.com/store/apps/details?id=com.detoxie

## App Working

https://github.com/user-attachments/assets/2cb0b092-5746-4a6b-97e2-7ef4b5c4d710


## Preview of app  

<p align="center">
  <img src="https://github.com/user-attachments/assets/2274bf1e-0403-4641-a142-1bd06267bf90" width="45%" />
  <img src="https://github.com/user-attachments/assets/76f4a7ed-e2e8-413c-8980-137bcddcc117" width="45%" />
</p>

## Functionality

### 1. Accessibility Service

* Built in **Java**.
* Detects when the user is on **Reels/Explore** by parsing the root node and checking for specific keywords (`reel`, `explore`).
* Tracks the time spent on these screens.

### 2. Native Module

* A **custom React Native bridge** to communicate between the native Accessibility Service and React code.
* Registers the accessibility service into the native module.
* Enables React Native (TS) to receive events/data from Android native code.


## Setup

1. Enable the Accessibility Service:

   * Open **Settings** → **Detoxie** → **Enable (true)**

2. The service will start monitoring Reels/Explore usage and tracking time.

## Tech Stack

* **React Native** (TS)
* **Android Accessibility Service** (Java)
* **Custom Native Module** for bridging

## Workflow

1. **TURN ON SERVICE** → `Settings → Detoxie → true`
2. Accessibility Service detects Reels/Explore activity
3. Native Module bridges data between **Accessibility Service (native)** and **React Native (TS)**
4. React Native layer consumes and processes this data


