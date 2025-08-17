import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, Clock, MessageCircle } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    type: "general",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Enviar al backend aquí
    console.log("Form submitted:", formData);
    setIsSubmitted(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-pale-yellow/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <section className="mb-8">
            <div className="rounded-3xl bg-white/90 backdrop-blur px-6 py-7 md:px-8 md:py-9 shadow-sm ring-1 ring-black/5 text-center">
              <div className="w-16 h-16 bg-dark-green rounded-full flex items-center justify-center mx-auto mb-6">
                <Send className="w-8 h-8 text-pale-yellow" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-dark-green tracking-tight">
                Message envoyé avec succès !
              </h1>
              <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
                Merci pour votre message. Notre équipe vous répondra dans les plus
                brefs délais.
              </p>

              <div className="mt-6">
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-dark-green text-pale-yellow font-semibold hover:bg-dark-green/90 transition-colors"
                >
                  Envoyer un autre message
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pale-yellow/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HERO / HEADER estandarizado */}
        <section className="mb-8">

          <div className="rounded-3xl bg-white/90 backdrop-blur px-6 py-7 md:px-8 md:py-9 shadow-sm ring-1 ring-black/5">          
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-dark-green tracking-tight flex items-center gap-4">
                  <Mail className="w-8 h-8" />
                  Contactez-nous
                </h1>
                <p className="mt-2 text-gray-600">
                  Une question, une suggestion ou besoin d&apos;aide ? Notre équipe
                est là pour vous accompagner.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
              <h3 className="text-xl font-semibold text-dark-green mb-6">
                Nos coordonnées
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-orange-beige mt-1" />
                  <div>
                    <p className="font-medium text-dark-green">Email</p>
                    <p className="text-gray-600">contact@greencart.fr</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-orange-beige mt-1" />
                  <div>
                    <p className="font-medium text-dark-green">Téléphone</p>
                    <p className="text-gray-600">01 23 45 67 89</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-orange-beige mt-1" />
                  <div>
                    <p className="font-medium text-dark-green">Adresse</p>
                    <p className="text-gray-600">
                      123 Rue de la Transition
                      <br />
                      75001 Paris, France
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-orange-beige mt-1" />
                  <div>
                    <p className="font-medium text-dark-green">Horaires</p>
                    <p className="text-gray-600">
                      Lun - Ven: 9h - 18h
                      <br />
                      Sam - Dim: 10h - 16h
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Link */}
            <div className="rounded-2xl bg-[#F7FAF4] text-dark-green ring-1 ring-black/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageCircle className="w-6 h-6" />
                <h3 className="text-lg font-semibold">Questions fréquentes</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Consultez notre FAQ pour trouver rapidement des réponses à vos
                questions.
              </p>
              <a
                href="/faq"
                className="inline-block font-semibold text-dark-green hover:text-medium-brown transition-colors"
              >
                Voir la FAQ →
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-8">
              <h3 className="text-2xl font-semibold text-dark-green mb-6">
                Envoyez-nous un message
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type of inquiry */}
                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Type de demande
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green/30"
                  >
                    <option value="general">Question générale</option>
                    <option value="support">Support technique</option>
                    <option value="producer">Devenir producteur</option>
                    <option value="partnership">Partenariat</option>
                    <option value="complaint">Réclamation</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Votre nom"
                      className="w-full px-4 py-3 bg-white rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green/30"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Adresse email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="votre@email.fr"
                      className="w-full px-4 py-3 bg-white rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green/30"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Sujet *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    placeholder="Objet de votre message"
                    className="w-full px-4 py-3 bg-white rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green/30"
                  />
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    placeholder="Décrivez votre demande en détail..."
                    className="w-full px-4 py-3 bg-white rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-dark-green/30 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-dark-green text-pale-yellow py-4 rounded-full font-semibold text-lg hover:bg-dark-green/90 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Envoyer le message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
