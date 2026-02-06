import React from 'react'
import { Users, Leaf, TrendingDown, Heart, Award, Target } from 'lucide-react'

export default function About() {
  const values = [
    {
      icon: Leaf,
      title: 'Écologique',
      description: 'Réduction du gaspillage alimentaire et préservation de l\'environnement'
    },
    {
      icon: Users,
      title: 'Solidaire',
      description: 'Soutien aux producteurs locaux et création de liens communautaires'
    },
    {
      icon: Heart,
      title: 'Éthique',
      description: 'Commerce équitable et transparence dans toutes nos actions'
    },
    {
      icon: Award,
      title: 'Qualité',
      description: 'Sélection rigoureuse de produits frais et authentiques'
    }
  ]

  const stats = [
    { number: '1,200+', label: 'Tonnes sauvées', icon: TrendingDown },
    { number: '500+', label: 'Producteurs partenaires', icon: Users },
    { number: '25,000+', label: 'Clients satisfaits', icon: Heart },
    { number: '95%', label: 'Taux de satisfaction', icon: Award }
  ]

  const team = [
    {
      name: 'Lucie Martin',
      role: 'Fondatrice Présidente',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300',
      description: 'Visionnaire et experte en innovation alimentaire durable'
    },
    {
      name: 'Thomas Delorme',
      role: 'Responsable produit & Logistique',
      image: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=300',
      description: 'Garant de l’efficacité logistique et de l’approvisionnement local'
    },
    {
      name: 'Sarah Bencheikh',
      role: 'Responsable communication & image',
      image: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=300',
      description: 'Spécialiste des stratégies de visibilité et d’engagement communautaire'
    },
    {
      name: 'Jean Dupont',
      role: 'Responsable marketing stratégique',
      image: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=300',
      description: 'Expert en positionnement et développement commercial éthique'
    },
    {
      name: 'Julie Moreau',
      role: 'Responsable finance & juridique',
      image: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=300',
      description: 'Pilote la conformité financière et les aspects réglementaires'
    }
  ]

  return (
    <div className="min-h-screen">

      {/* Hero Section corrigé */}
      <section className="bg-dark-green text-pale-yellow py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              Notre <span className="text-pale-yellow">mission</span>
            </h1>
            <p className="text-xl text-pale-yellow/90 max-w-3xl mx-auto">
              GreenCart révolutionne la consommation alimentaire en connectant consommateurs 
              conscients et producteurs locaux pour un avenir plus durable.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-dark-green mb-6">
                Notre histoire
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Tout a commencé quand Lucie, ingénieure agroalimentaire, a découvert l'ampleur 
                  du gaspillage alimentaire dans notre pays : 10 millions de tonnes par an, 
                  soit 150 kg par habitant.
                </p>
                <p>
                  Convaincue qu'il fallait agir, elle a créé GreenCart en 2023 pour donner 
                  une seconde vie aux produits alimentaires de qualité et soutenir nos 
                  producteurs locaux face aux défis économiques.
                </p>
                <p>
                  Aujourd'hui, GreenCart c'est une communauté de consommateurs engagés, 
                  de producteurs passionnés et une technologie innovante au service 
                  d'une alimentation plus responsable.
                </p>
              </div>
            </div>

            <div className="relative">
              <img
                src="https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Lucie Martin, fondatrice de GreenCart"
                className="rounded-2xl shadow-lg w-full"
              />

              {/* Badge corrigé */}
              <div className="absolute -bottom-6 -left-6 bg-pale-yellow text-dark-green p-4 rounded-xl shadow-lg">
                <div className="text-center">
                  <p className="font-bold text-2xl">2023</p>
                  <p className="text-sm">Année de création</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-pale-yellow/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-dark-green mb-4">
              Nos valeurs
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Les principes qui guident notre action quotidienne pour un monde plus durable
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-center animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-dark-green text-pale-yellow w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-dark-green mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-dark-green mb-4">
              Notre impact
            </h2>
            <p className="text-gray-600 text-lg">
              Les chiffres qui témoignent de notre engagement
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-dark-green text-pale-yellow w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-10 h-10" />
                </div>
                <div className="text-4xl font-bold text-dark-green mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-pale-yellow/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-dark-green mb-4">
              Notre équipe
            </h2>
            <p className="text-gray-600 text-lg">
              Les personnes passionnées qui rendent GreenCart possible
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-8 max-w-5xl mx-auto">
            {team.map((member, index) => {
              const isFirstOfLastTwo = team.length % 3 === 2 && index === team.length - 2

              return (
                <div
                  key={index}
                  className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden animate-slide-up md:col-span-2 ${isFirstOfLastTwo ? 'md:col-start-2' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <img src={member.image} alt={member.name} className="w-full h-64 object-cover" />
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-semibold text-dark-green mb-1">{member.name}</h3>
                    <p className="text-pale-yellow font-medium mb-3">{member.role}</p>
                    <p className="text-gray-600 text-sm">{member.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-dark-green text-pale-yellow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">

            {/* Icône corrigée */}
            <div className="bg-pale-yellow text-dark-green w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-10 h-10" />
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Notre engagement pour 2025
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-pale-yellow mb-2">2,000</div>
                <p className="text-pale-yellow/90">Tonnes sauvées du gaspillage</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pale-yellow mb-2">1,000</div>
                <p className="text-pale-yellow/90">Nouveaux producteurs partenaires</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pale-yellow mb-2">50,000</div>
                <p className="text-pale-yellow/90">Familles sensibilisées</p>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  )
}
