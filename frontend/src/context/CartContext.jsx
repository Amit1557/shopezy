import { createContext, useContext, useReducer, useEffect } from 'react'

const CartContext = createContext(null)

const CART_KEY = 'shopezy_cart'

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.findIndex(
        i => i.product_id === action.item.product_id &&
             i.selected_size === action.item.selected_size &&
             i.selected_color === action.item.selected_color
      )
      if (existing >= 0) {
        const items = [...state.items]
        items[existing] = { ...items[existing], quantity: items[existing].quantity + action.item.quantity }
        return { ...state, items }
      }
      return { ...state, items: [...state.items, action.item] }
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((_, i) => i !== action.index) }
    case 'UPDATE_QUANTITY': {
      const items = [...state.items]
      items[action.index] = { ...items[action.index], quantity: action.quantity }
      return { ...state, items }
    }
    case 'CLEAR_CART':
      return { items: [] }
    case 'LOAD_CART':
      return action.cart
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, { items: [] })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY)
      if (saved) dispatch({ type: 'LOAD_CART', cart: JSON.parse(saved) })
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart])

  const addItem = (item) => dispatch({ type: 'ADD_ITEM', item })
  const removeItem = (index) => dispatch({ type: 'REMOVE_ITEM', index })
  const updateQuantity = (index, quantity) => {
    if (quantity < 1) return removeItem(index)
    dispatch({ type: 'UPDATE_QUANTITY', index, quantity })
  }
  const clearCart = () => dispatch({ type: 'CLEAR_CART' })

  const totalItems = cart.items.reduce((sum, i) => sum + i.quantity, 0)
  const totalAmount = cart.items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, updateQuantity, clearCart, totalItems, totalAmount }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
