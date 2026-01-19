import { useState } from 'react'
import { AppShell } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { faqData, categoryLabels, type FaqItem } from '@/data/faq'

export function Help() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<FaqItem['category'] | 'all'>('all')

  const categories = Object.keys(categoryLabels) as FaqItem['category'][]

  const filteredFaq =
    selectedCategory === 'all'
      ? faqData
      : faqData.filter((item) => item.category === selectedCategory)

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <AppShell title="Aide" backTo="/settings">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Guide de demarrage rapide */}
        <Card>
          <CardHeader>
            <CardTitle>Demarrage rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <p>
                  <strong className="text-gray-800">Passez en mode Parent</strong> en
                  touchant longuement le titre de l'application (2 secondes).
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <p>
                  <strong className="text-gray-800">Configurez un code PIN</strong> pour
                  securiser l'acces au mode Parent.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <p>
                  <strong className="text-gray-800">Ajoutez des transactions</strong> avec
                  le bouton + en bas a droite du tableau de bord.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <p>
                  <strong className="text-gray-800">Sauvegardez vos donnees</strong> via
                  les parametres (export JSON ou Google Drive).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtres de categories */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tout
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Questions frequentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-100">
              {filteredFaq.map((item, index) => (
                <div key={index} className="py-3">
                  <button
                    onClick={() => toggleExpand(index)}
                    className="w-full text-left flex items-start justify-between gap-4"
                  >
                    <span className="font-medium text-gray-800">{item.question}</span>
                    <span
                      className={`flex-shrink-0 text-gray-400 transition-transform ${
                        expandedIndex === index ? 'rotate-180' : ''
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </button>
                  {expandedIndex === index && (
                    <div className="mt-2 text-sm text-gray-600 pl-0">{item.answer}</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Informations */}
        <Card>
          <CardHeader>
            <CardTitle>A propos</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>
              <strong className="text-gray-800">Argent de Poche</strong> - Version 1.0
            </p>
            <p>
              Application de gestion de l'argent de poche pour les familles.
            </p>
            <p>
              Donnees stockees localement sur votre appareil. Aucune connexion internet
              requise pour l'utilisation quotidienne.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
