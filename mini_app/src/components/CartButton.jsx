// mini_app/src/components/CartButton.jsx
// Плаваюча кнопка кошика (відображається коли є хоча б 1 товар).

export default function CartButton({ count, onClick }) {
  return (
    <button style={styles.btn} onClick={onClick}>
      🛒 Кошик
      <span style={styles.badge}>{count}</span>
    </button>
  );
}

const styles = {
  btn: {
    position: "fixed",
    bottom: 20,
    right: 16,
    background: "#2481cc",
    color: "#fff",
    border: "none",
    borderRadius: 24,
    padding: "12px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(36,129,204,0.4)",
    display: "flex",
    alignItems: "center",
    gap: 8,
    zIndex: 100,
  },
  badge: {
    background: "#fff",
    color: "#2481cc",
    borderRadius: "50%",
    width: 22,
    height: 22,
    fontSize: 12,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
