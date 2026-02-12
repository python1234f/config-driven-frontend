# ⚡ High-Frequency Industrial AI Dashboard

![Refinery Mesh Demo](./assets/refinery-mesh-full.jpg)

> **A React 18 Proof-of-Concept designed for extreme rendering performance.**
> Visualizing real-time industrial data (SCADA) across hundreds of interactive nodes.

## 💼 Executive Summary (For Recruiters & Product Owners)

This project demonstrates a **high-performance frontend architecture** capable of handling heavy data streams typical in Industrial IoT, FinTech, or Observability platforms.

The application is engineered to maintain a buttery smooth **60 FPS** frame rate even when processing thousands of signals per second. It successfully overcomes the rendering challenges inherent in complex, real-time data visualizations.

### Key Highlights:
* **Massive Scalability:** Architecture successfully renders **1000s of live nodes**. The demo includes a "Refinery Mesh" simulation with 200 interconnected units and complex signal propagation.
* **Client-Agnostic Design:** The entire UI—including diagrams, charts, and business rules—is dynamically generated from JSON configuration files, allowing for rapid deployment across different industrial sites without code changes.
* **Real-Time Physics:** Visualizes complex alarm propagations (e.g., a "chain reaction" failure passing through pipe networks) instantly and fluidly.

---

## 🚦 Getting Started


1.  **Install dependencies**
    ```bash
    npm install
    ```

2.  **Run the simulation**
    ```bash
    npm run dev
    ```


## 🛠 Technical Deep Dive (For Engineers)

This project moves away from the traditional "Prop Drilling" pattern to an **Atomic State Architecture** to efficiently handle high-frequency updates (5Hz - 10Hz tick rates).

### The Stack
* **Core:** React 18 (Vite)
* **State Manager:** Zustand (External Store pattern)
* **Visualization:** React Flow (@xyflow/react) + Recharts
* **Logic:** Custom deterministic simulation engine

### 🚀 Performance Architecture: How we achieved 60 FPS

To ensure the main thread remains unblocked during heavy data ingestion, we implemented three specific optimizations:

#### 1. Atomic State Subscriptions ("Smart Nodes")
Instead of passing data down from a parent component, every single Node on the diagram connects directly to the store.

* **Architecture:** Data enters the Global Store. Only the specific Node with ID `#42` subscribes to updates for `id: 42`.
* **Result:** When a signal changes, only the relevant Node re-renders. The Parent diagram component renders **0 times**, significantly reducing CPU load.

#### 2. Shallow Equality Checks
We implemented a custom hook `useRealtimeSelector` with rigorous equality checking. Even if the data stream pushes a new object reference, the UI component **skips rendering** unless the specific visual properties (color, label, alarm status) have actually changed.

```javascript
// Example: This component ONLY renders if 'alarm' or 'label' changes.
// It ignores the hundreds of other signals updating in the background.
const { label, alarm } = useRealtimeSelector(
  (state) => selectUnitData(state, id),
  (prev, next) => prev.alarm === next.alarm && prev.label === next.label
);