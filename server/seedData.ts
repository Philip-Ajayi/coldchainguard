export interface WHOManualChunk {
  id: string;
  category: 'ELECTRONIC_UNIT' | 'WHO_PQS_STANDARD' | 'TROUBLESHOOTING' | 'WIRING';
  title: string;
  source: string;
  content: string;
  tags: string[];
}

export interface SyntheticBenchmarkCase {
  id: string;
  name: string;
  description: string;
  compressorModel: string;
  electronicUnitCode: string;
  blinkCode: number;
  inputVoltage: number;
  windingResistance: number;
  fanAmperage: number;
  ambientTemp: number;
  expectedRootCause: string;
}

export const WHO_PQS_SEED_CORPUS: WHOManualChunk[] = [
  {
    id: "WHO-PQS-E003-SEC01",
    category: "WHO_PQS_STANDARD",
    title: "WHO PQS E003/SD01-1: Solar Direct Drive Vaccine Refrigerators Operating Thresholds",
    source: "WHO Equipment Performance Specifications (PQS E003, Rev 2023)",
    content: "Solar Direct Drive (SDD) vaccine refrigerators must maintain internal vaccine storage temperatures between +2.0°C and +8.0°C without batteries during a minimum 72-hour cloudy autonomy period. Danfoss/Secop BD35F/BD50F electronic controllers (101N0210, 101N0220) are certified under Class A surge suppression. The electronic unit shuts down if DC input drops below 10.4V (cut-out) to safeguard compressor motor windings and resets automatically when voltage recovers to 11.7V (cut-in).",
    tags: ["who", "voltage", "sdd", "pqs", "threshold", "temperature"]
  },
  {
    id: "SECOP-BD35F-BLINK1",
    category: "TROUBLESHOOTING",
    title: "Blink Code 1: Battery / DC Operational Voltage Cut-Off Sequence",
    source: "Secop BD-Series Electronic Unit Diagnostic Manual 101N0210/0220",
    content: "One single LED flash repeated every 4.0 seconds indicates Battery Protection Cut-Out. The measured potential between controller terminals [+] and [-] has dropped below the factory threshold (10.4V for 12V DC systems or 22.8V for 24V DC systems). Common causes in SDD clinics: (1) Dust/calcification coating on PV array, (2) Corroded crimp terminals on junction box inducing series resistance drop > 1.2V under load, or (3) Cable gauge thinner than 6.0 mm² over runs exceeding 5 meters. Step: Verify voltage with multimeter directly on terminals [+] and [-] during compressor start attempt.",
    tags: ["blink-1", "undervoltage", "power", "solar", "battery", "resistance"]
  },
  {
    id: "SECOP-BD35F-BLINK2",
    category: "TROUBLESHOOTING",
    title: "Blink Code 2: Condenser Fan Over-Current Trip Procedure",
    source: "Secop Technical Bulletin TB-101-08: Condenser Cooling Diagnostics",
    content: "Two continuous flashes indicate Fan Over-Current Protection. The electronic unit cuts power if the current drawn from Terminal [F] exceeds 0.5A continuous or 1.0A peak for > 1.0 second. Procedure: (1) Switch OFF main DC isolator. (2) Detach fan lead from Terminal [F]. (3) Measure fan internal DC resistance. Resistance < 24.0 Ohms indicates a shorted motor stator. (4) Reconnect DC isolator with Terminal [F] open-circuit. If compressor starts normally without fan, replace 12V DC axial condenser fan.",
    tags: ["blink-2", "fan", "overcurrent", "terminal-f", "short-circuit"]
  },
  {
    id: "SECOP-BD35F-BLINK3",
    category: "TROUBLESHOOTING",
    title: "Blink Code 3: Motor Start Failure & Rotor Lock Isolation Sequence",
    source: "WHO PQS E003 Appendix 4 / Secop Field Service Manual 084R9022",
    content: "Three continuous flashes indicate Motor Start Stall. The rotor cannot spin up from rest due to: (1) Excessive differential refrigerant pressure (> 5.0 bar / 72.5 PSI across suction and discharge lines), often caused by rapid cycling without equalization, or (2) Seized mechanical rotor piston, or (3) Defective electronic controller inverter output stage. Multimeter test sequence: Disconnect controller from compressor 3-pin feedthrough. Measure resistance across the 3 stator pins (upper, lower-left, lower-right). Each phase-to-phase pair must measure 2.1 Ohms (+/- 0.3 Ohm) at 20°C. If any pair reads infinite resistance (open-circuit), stator is burned; compressor must be replaced.",
    tags: ["blink-3", "rotor-stall", "start-failure", "stator", "winding", "resistance", "pins"]
  },
  {
    id: "SECOP-BD35F-BLINK4",
    category: "TROUBLESHOOTING",
    title: "Blink Code 4: Motor Minimum Speed Failure Troubleshooting",
    source: "Secop Service Bulletin TB-104: RPM Regulation Under Thermal Load",
    content: "Four continuous flashes indicate Minimum Motor Speed Failure. If compressor rotational speed drops below 1,850 RPM, the controller trips off. This fault is triggered when thermal overload causes motor deceleration or when the speed control resistor connected between Terminal [C] and Terminal [T] has drift or moisture leakage. Default zero-resistor operation maintains 2,000 RPM. Measure resistance across [C] and [T] with wire removed. Inspect thermal grease on controller backplate.",
    tags: ["blink-4", "rpm", "speed", "terminal-c", "terminal-t", "governor"]
  },
  {
    id: "SECOP-BD35F-BLINK5",
    category: "TROUBLESHOOTING",
    title: "Blink Code 5: Electronic Unit Thermal Overheat Cut-Out",
    source: "Secop BD35F Diagnostic Bulletin: Inverter Thermal Cut-off",
    content: "Five continuous flashes indicate Controller Thermal Overheat. If internal PCB heatsink exceeds 85°C (185°F), the thermal limiter disables motor output. Common in sub-Saharan clinics where compressor compartment ventilation grilles are obstructed or solar direct drive rooms lack passive airflow. The unit will auto-restart once the heatsink cools to 75°C. Step: Clear dust filters, remove lint from condenser fins, and measure ambient compressor enclosure temperature.",
    tags: ["blink-5", "thermal", "overheat", "heatsink", "ambient", "ventilation"]
  },
  {
    id: "SECOP-WIRING-PINS",
    category: "WIRING",
    title: "Secop 101N0210 Controller Terminal Pinout & Meter Probing Guide",
    source: "Danfoss / Secop Field Manual Pinout Specification",
    content: "Terminal [+] and [-]: Input power 12V/24V DC. Terminal [F]: Fan negative/control (12V DC, max 0.5A). Terminal [D]: Diagnostic LED cathode. (Connect LED anode via 1.5 kOhm resistor to [+]). Terminal [C]: Speed calibration and battery cut-out adjustment resistor. Terminal [P]: Solar Direct Drive low-irradiance PTC or pressure switch. Terminal [T]: Electronic temperature controller / thermostat contact.",
    tags: ["wiring", "schematic", "terminals", "pins", "multimeter", "led"]
  }
];

export const SYNTHETIC_BENCHMARKS: SyntheticBenchmarkCase[] = [
  {
    id: "BENCH-01",
    name: "Scenario A: 3-Blink Rotor Lock / Burned Winding",
    description: "Simulates locked compressor mechanical cylinder and high resistance winding burnout (4.8Ω vs 2.1Ω expected).",
    compressorModel: "BD35F",
    electronicUnitCode: "101N0210",
    blinkCode: 3,
    inputVoltage: 12.2,
    windingResistance: 4.8,
    fanAmperage: 0.35,
    ambientTemp: 34,
    expectedRootCause: "Motor stator coil burnout (4.8 Ohms measured vs 2.1 Ohms WHO nominal limit)."
  },
  {
    id: "BENCH-02",
    name: "Scenario B: 1-Blink Solar Array Dust & Undervoltage Sag",
    description: "Simulates severe voltage drop across high-impedance PV wiring during compressor inrush draw (10.1V measured).",
    compressorModel: "BD35F",
    electronicUnitCode: "101N0210",
    blinkCode: 1,
    inputVoltage: 10.1,
    windingResistance: 2.1,
    fanAmperage: 0.32,
    ambientTemp: 32,
    expectedRootCause: "DC input voltage collapsed below the 10.4V cut-out threshold during spin-up inrush."
  },
  {
    id: "BENCH-03",
    name: "Scenario C: 2-Blink Seized Condenser Cooling Fan",
    description: "Simulates a seized brushless fan motor stator coil drawing 0.72A on Terminal [F], exceeding the 0.5A limit.",
    compressorModel: "BD50F",
    electronicUnitCode: "101N0220",
    blinkCode: 2,
    inputVoltage: 12.4,
    windingResistance: 2.1,
    fanAmperage: 0.72,
    ambientTemp: 36,
    expectedRootCause: "Condenser fan current (0.72A) tripped internal 0.5A thermal protection breaker on Terminal F."
  },
  {
    id: "BENCH-04",
    name: "Scenario D: 5-Blink Desert Ambient Thermal Overheat",
    description: "Simulates extreme cabinet ambient temperatures (46°C) and dust-choked ventilation causing controller heatsink to exceed 85°C.",
    compressorModel: "BD35F",
    electronicUnitCode: "101N0210",
    blinkCode: 5,
    inputVoltage: 12.5,
    windingResistance: 2.1,
    fanAmperage: 0.35,
    ambientTemp: 46,
    expectedRootCause: "Controller PCB heatsink temperature exceeded 85°C cut-out due to choked enclosure ventilation."
  }
];
