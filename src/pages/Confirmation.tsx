import React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'

export default function Confirmation() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-pale-yellow/20 px-4 py-12">
			<div className="bg-white p-8 rounded-lg shadow-md text-center max-w-lg w-full">
				<CheckCircle className="text-green-600 mx-auto mb-4" size={48} />
				<h1 className="text-2xl font-bold text-dark-green mb-2">Commande confirmée !</h1>
				<p className="text-gray-600 mb-6">
					Merci pour votre achat. Vous recevrez bientôt un e-mail avec les détails de votre commande.
				</p>
				<Link
					to="/account/orders"
					className="inline-block bg-dark-green text-pale-yellow px-6 py-3 rounded-full font-semibold hover:bg-dark-green/90 transition"
				>
					Consulter mes commandes
				</Link>
			</div>
		</div>
	)
}
