# Detoxie App

Detoxie is a React Native application that integrates with Android's **Accessibility Service** to detect and track user activity (such as time spent on Reels/Explore). It uses a **custom Native Module** to bridge communication between the native Android code and the React Native (JS/TS) layer.

## Preview of app  

<p align="center">
  <img src="https://github.com/user-attachments/assets/b7c677d0-1da4-49aa-8277-44e09569ac17" width="45%" />
  <img src="https://github.com/user-attachments/assets/75e9c84b-4557-4387-af38-85fa5d8615bd" width="45%" />
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


