import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, MapPin, Calendar, Leaf } from 'lucide-react'
import { useCart } from '../contexts/CartContext'

interface Product {
  id: string
  name: string
  price: number
  originalPrice: number
  image: string
  producer: string
  category: string
  region: string
  dluo: string
  co2Impact: number
  stock: number
  discount: number
}

interface ProductCardProps {
  product: Product
  viewMode: 'grid' | 'list'
}

export default function ProductCard({ product, viewMode }: ProductCardProps) {
  const { dispatch } = useCart()

  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        producer: product.producer,
        dluo: product.dluo
      }
    })
  }

  if (viewMode === 'list') {
    return (
      <Link to={`/product/${product.id}`} className="block">
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
          <div className="flex gap-6">
            <div className="relative w-32 h-32 flex-shrink-0">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute top-2 left-2 bg-orange-beige text-white px-2 py-1 rounded-full text-xs font-semibold">
                -{product.discount}%
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-dark-green">{product.name}</h3>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-dark-green">
                      {product.price.toFixed(2)}€
                    </span>
                    <span className="text-gray-400 line-through">
                      {product.originalPrice.toFixed(2)}€
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 mb-2">{product.producer}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{product.region}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>DLUO: {new Date(product.dluo).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Leaf className="w-4 h-4 text-dark-green" />
                  <span>{product.co2Impact}kg CO₂</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Stock: {product.stock} unités
                </span>
                <button
                  onClick={addToCart}
                  className="bg-dark-green text-pale-yellow px-4 py-2 rounded-full text-sm font-medium hover:bg-dark-green/90 transition-colors flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Ajouter au panier
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link to={`/product/${product.id}`} className="block group">
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
        <div className="relative">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-4 left-4 bg-orange-beige text-white px-3 py-1 rounded-full text-sm font-semibold">
            -{product.discount}%
          </div>
          <div className="absolute top-4 right-4 bg-dark-green text-pale-yellow px-3 py-1 rounded-full text-xs">
            DLUO: {new Date(product.dluo).toLocaleDateString('fr-FR')}
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-semibold text-dark-green mb-2 group-hover:text-medium-brown transition-colors">
            {product.name}
          </h3>
          <p className="text-gray-600 text-sm mb-2">{product.producer}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{product.region}</span>
            </div>
            <div className="flex items-center gap-1">
              <Leaf className="w-3 h-3 text-dark-green" />
              <span>{product.co2Impact}kg CO₂</span>
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-dark-green">
                {product.price.toFixed(2)}€
              </span>
              <span className="text-gray-400 line-through text-sm">
                {product.originalPrice.toFixed(2)}€
              </span>
            </div>
            <span className="text-sm text-gray-500">
              Stock: {product.stock}
            </span>
          </div>
          <button
            onClick={addToCart}
            className="w-full bg-dark-green text-pale-yellow py-2 rounded-full font-medium hover:bg-dark-green/90 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Ajouter au panier
          </button>
        </div>
      </div>
    </Link>
  )
}