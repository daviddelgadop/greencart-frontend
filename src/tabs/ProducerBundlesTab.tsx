import React from 'react'
import { Plus, Eye, Edit } from 'lucide-react'

type Prod = {
  id: string
  name: string
  price: number
  stock: number
  sold: number
  status: 'active' | 'out_of_stock'
  dluo: string
}

const mockProducts: Prod[] = [
  { id: '1', name: 'Pommes Bio du Verger', price: 3.50, stock: 25, sold: 15, status: 'active', dluo: '2025-02-15' },
  { id: '2', name: 'Poires Williams', price: 4.20, stock: 0, sold: 30, status: 'out_of_stock', dluo: '2025-02-10' },
  { id: '3', name: 'Confiture artisanale', price: 5.90, stock: 12, sold: 8, status: 'active', dluo: '2025-03-05' }
]

export default function ProductsTab() {
  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-dark-green"></h2>
        <button className="bg-dark-green text-pale-yellow px-4 py-2 rounded-full font-semibold hover:bg-dark-green/90 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Ajouter un produit</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[32%]" /> {/* Produit */}
              <col className="w-[10%]" /> {/* Prix */}
              <col className="w-[10%]" /> {/* Stock */}
              <col className="w-[10%]" /> {/* Vendus */}
              <col className="w-[14%]" /> {/* DLUO */}
              <col className="w-[12%]" /> {/* Statut */}
              <col className="w-[12%]" /> {/* Actions */}
            </colgroup>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendus</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DLUO</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockProducts.map(product => (
                <tr key={product.id}>
                  <td
                    className="px-6 py-4 font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap"
                    title={product.name}
                  >
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{product.price.toFixed(2)}€</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{product.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{product.sold}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {new Date(product.dluo).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.status === 'active' ? 'Actif' : 'Rupture'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-dark-green hover:text-medium-brown" title="Voir">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-dark-green hover:text-medium-brown" title="Modifier">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
