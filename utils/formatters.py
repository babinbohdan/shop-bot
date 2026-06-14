"""
utils/formatters.py — допоміжні функції для форматування повідомлень.
Централізуємо всі текстові шаблони тут, щоб не дублювати код у хендлерах.
"""

from database.models import Order, OrderItem, User


def format_order_for_admin(order: Order, user: User) -> str:
    """
    Формує текст повідомлення адміну про нове замовлення.
    Викликається з cart.py та при необхідності повторного надсилання.
    """
    from datetime import datetime

    delivery_label = (
        "🚚 Адресна доставка" if user.delivery_type == "delivery" else "🏪 Самовивіз"
    )

    items_lines = []
    for item in order.items:
        subtotal = float(item.price_at_order) * item.quantity
        items_lines.append(
            f"  • {item.product.name} × {item.quantity} шт. = {subtotal:.2f} грн"
        )

    items_text = "\n".join(items_lines) if items_lines else "  (немає позицій)"

    return (
        f"🔔 <b>НОВЕ ЗАМОВЛЕННЯ #{order.id}</b>\n"
        f"📅 {datetime.now().strftime('%d.%m.%Y %H:%M')}\n"
        f"{'─' * 28}\n"
        f"👤 Клієнт: <b>{user.full_name}</b>\n"
        f"📱 Телефон: {user.phone}\n"
        f"🏙 Місто: {user.city}\n"
        f"📦 Доставка: {delivery_label}\n"
        f"{'─' * 28}\n"
        f"<b>Склад замовлення:</b>\n{items_text}\n"
        f"{'─' * 28}\n"
        f"💰 <b>Сума: {float(order.total_price):.2f} грн</b>\n"
        f"💬 Коментар: {order.comment or '—'}"
    )


def format_product_card(product) -> str:
    """Картка товару для каталогу та публікацій у канал."""
    stock_icon = "✅" if product.in_stock else "❌"
    stock_text = "Є в наявності" if product.in_stock else "Немає в наявності"
    return (
        f"🛍 <b>{product.name}</b>\n\n"
        f"{product.description}\n\n"
        f"💰 Ціна: <b>{product.price} грн</b>\n"
        f"{stock_icon} {stock_text}"
    )


def format_user_profile(user: User) -> str:
    """Відображення профілю клієнта."""
    delivery_label = (
        "🚚 Адресна доставка" if user.delivery_type == "delivery" else "🏪 Самовивіз"
    )
    return (
        f"👤 <b>Ваш профіль</b>\n\n"
        f"ПІБ: {user.full_name}\n"
        f"📱 Телефон: {user.phone}\n"
        f"🏙 Місто: {user.city}\n"
        f"📦 Доставка: {delivery_label}"
    )
