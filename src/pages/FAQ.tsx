import React, { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Search,
  ShoppingCart,
  Truck,
  CreditCard,
  Leaf,
  Users,
} from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string; // 'general' | 'orders' | 'delivery' | 'payment' | 'products' | 'producers'
}

const faqData: FAQItem[] = [
  // General
  {
    id: "1",
    question: "Qu'est-ce que GreenCart ?",
    answer:
      "GreenCart est une plateforme e-commerce dédiée aux produits alimentaires locaux et à la lutte contre le gaspillage. Nous connectons les consommateurs avec des producteurs locaux pour donner une seconde vie aux produits de qualité à prix réduits.",
    category: "general",
  },
  {
    id: "2",
    question: "Comment fonctionne le système anti-gaspillage ?",
    answer:
      "Nos producteurs partenaires nous proposent leurs invendus ou produits proches de leur date limite. Nous les vendons à prix réduits (jusqu'à 50% de réduction) pour éviter qu'ils ne soient jetés, tout en garantissant leur qualité et leur sécurité.",
    category: "general",
  },

  // Orders
  {
    id: "3",
    question: "Comment passer une commande ?",
    answer:
      'Créez votre compte, parcourez notre catalogue, ajoutez les produits à votre panier, vérifiez vos informations de livraison et procédez au paiement. Vous recevrez une confirmation par email.',
    category: "orders",
  },
  {
    id: "4",
    question: "Puis-je modifier ma commande après validation ?",
    answer:
      "Vous pouvez modifier votre commande dans les 2 heures suivant la validation, en nous contactant directement. Passé ce délai, la commande est préparée et ne peut plus être modifiée.",
    category: "orders",
  },
  {
    id: "5",
    question: "Comment suivre ma commande ?",
    answer:
      'Connectez-vous à votre compte et consultez la section "Mes commandes". Vous recevrez également des emails de suivi à chaque étape (préparation, expédition, livraison).',
    category: "orders",
  },

  // Delivery
  {
    id: "6",
    question: "Quels sont les délais de livraison ?",
    answer:
      "Livraison standard : 2 à 3 jours ouvrés (4,90 €, gratuite dès 30 €). Les produits frais sont expédiés en priorité",
    category: "delivery",
  },
  {
    id: "7",
    question: "Comment sont conservés les produits frais pendant le transport ?",
    answer:
      "Nous utilisons des emballages isothermes et des packs réfrigérants pour maintenir la chaîne du froid. Les produits surgelés sont expédiés avec de la carboglace.",
    category: "delivery",
  },
  {
    id: "8",
    question: "Que faire si je ne suis pas présent à la livraison ?",
    answer:
      "Le transporteur laissera un avis de passage. Vous aurez 48h pour récupérer votre colis. Pour les produits frais, nous recommandons la livraison en point relais réfrigéré.",
    category: "delivery",
  },

  // Payment
  {
    id: "9",
    question: "Quels moyens de paiement acceptez-vous ?",
    answer:
      "Nous acceptons les cartes bancaires (Visa, Mastercard, American Express), PayPal, les virements bancaires et les chèques cadeaux GreenCart.",
    category: "payment",
  },
  {
    id: "10",
    question: "Mes données bancaires sont-elles sécurisées ?",
    answer:
      "Oui, tous les paiements sont sécurisés par cryptage SSL et traités par notre partenaire certifié PCI-DSS. Nous ne stockons aucune donnée bancaire sur nos serveurs.",
    category: "payment",
  },

  // Products
  {
    id: "11",
    question: "Comment vérifiez-vous la qualité des produits ?",
    answer:
      "Tous nos producteurs sont sélectionnés selon des critères stricts. Nous vérifions leurs certifications, visitons leurs exploitations et contrôlons régulièrement la qualité des produits.",
    category: "products",
  },
  {
    id: "12",
    question: "Que signifie DLUO et DLC ?",
    answer:
      "DLUO (Date Limite d'Utilisation Optimale) : le produit peut être consommé après cette date mais peut perdre certaines qualités. DLC (Date Limite de Consommation) : ne pas consommer après cette date.",
    category: "products",
  },
  {
    id: "13",
    question: "Puis-je retourner un produit ?",
    answer:
      "Les retours ne sont possibles qu'en cas de défaut de qualité ou d'erreur de livraison. Signalez le problème dans les 24h avec photos. Nous procédons alors au remboursement intégral.",
    category: "products",
  },

  // Producers
  {
    id: "14",
    question: "Comment devenir producteur partenaire ?",
    answer:
      "Remplissez le formulaire de candidature sur notre site. Nous étudions votre dossier selon nos critères (qualité, localité, certifications) et vous recontactons sous 15 jours.",
    category: "producers",
  },
  {
    id: "15",
    question: "Quelles sont les conditions pour vendre sur GreenCart ?",
    answer:
      "Être producteur local, respecter les normes de qualité et sécurité alimentaire, avoir une assurance responsabilité civile professionnelle et accepter nos conditions de vente.",
    category: "producers",
  },
];

const categories = [
  { id: "all", name: "Toutes les questions", icon: HelpCircle },
  { id: "general", name: "Général", icon: HelpCircle },
  { id: "orders", name: "Commandes", icon: ShoppingCart },
  { id: "delivery", name: "Livraison", icon: Truck },
  { id: "payment", name: "Paiement", icon: CreditCard },
  { id: "products", name: "Produits", icon: Leaf },
  { id: "producers", name: "Producteurs", icon: Users },
];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredFAQ = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return faqData.filter((item) => {
      const matchesSearch =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-pale-yellow/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HERO estandarizado */}
        <section className="mb-8">
          <div className="rounded-3xl bg-white/90 backdrop-blur px-6 py-7 md:px-8 md:py-9 shadow-sm ring-1 ring-black/5">
            <div className="text-center">
              <div className="w-16 h-16 bg-dark-green rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-8 h-8 text-pale-yellow" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-dark-green tracking-tight">
                Foire Aux Questions
              </h1>
              <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
                Trouvez rapidement des réponses à vos questions sur GreenCart,
                nos produits et nos services.
              </p>
            </div>

            {/* Controles estandarizados */}
            <div className="mt-6 flex flex-col gap-4">
              {/* 1) Etiquetas (pills) en UNA línea, scrollable */}
              <div className="flex overflow-x-auto gap-2 py-1">
                {categories.map((c) => {
                  const Icon = c.icon;
                  const active = selectedCategory === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.id)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border whitespace-nowrap ${
                        active
                          ? "bg-dark-green text-pale-yellow border-dark-green"
                          : "bg-white text-dark-green hover:bg-dark-green/10 border-gray-200"
                      }`}
                      title={c.name}
                    >
                      <Icon className="w-4 h-4" />
                      {c.name}
                    </button>
                  );
                })}
              </div>

              {/* 2) Barra de búsqueda en OTRA línea y 100% ancho */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher dans la FAQ…"
                  aria-label="Recherche dans la FAQ"
                  className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green/30"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Resultados */}
        <p className="text-sm text-gray-600 mb-6">
          {filteredFAQ.length} question{filteredFAQ.length > 1 ? "s" : ""} trouvée
          {filteredFAQ.length > 1 ? "s" : ""}.
        </p>

        {/* Lista FAQ */}
        {filteredFAQ.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 shadow-sm ring-1 ring-black/5 text-center">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Aucune question trouvée
            </h3>
            <p className="text-gray-600">
              Essayez de modifier votre recherche ou contactez-nous directement.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFAQ.map((item) => {
              const isOpen = openItems.includes(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${item.id}`}
                  >
                    <h3 className="text-lg font-semibold text-dark-green pr-4">
                      {item.question}
                    </h3>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div id={`faq-${item.id}`} className="px-6 pb-5">
                      <div className="border-t border-gray-100 pt-4">
                        <p className="text-gray-700 leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* CTA de contacto */}
        <div className="mt-12 rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-dark-green mb-3">
            Vous ne trouvez pas votre réponse ?
          </h2>
          <p className="text-gray-600 mb-6">
            Notre équipe est là pour vous aider. N&apos;hésitez pas à nous
            contacter !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="bg-dark-green text-pale-yellow px-6 py-3 rounded-full font-semibold hover:bg-dark-green/90 transition-colors"
            >
              Nous contacter
            </a>
            <a
              href="mailto:support@greencart.fr"
              className="border-2 border-dark-green text-dark-green px-6 py-3 rounded-full font-semibold hover:bg-dark-green hover:text-pale-yellow transition-colors"
            >
              support@greencart.fr
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
