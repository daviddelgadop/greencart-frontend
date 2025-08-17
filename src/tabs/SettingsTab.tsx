import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import PasswordConfirmModal from '../components/PasswordConfirmModal';
import { http } from '../lib/api';

const PASSWORD_CONFIRM_DELETE =
  import.meta.env.VITE_PASSWORD_CONFIRM_DELETE === 'true';

type Settings = {
  notif_promotions: boolean;
  notif_new_products: boolean;
  notif_orders: boolean;
};

export default function SettingsTab() {
  const [settings, setSettings] = useState<Settings>({
    notif_promotions: false,
    notif_new_products: false,
    notif_orders: false,
  });

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await http.get<any>('/api/user-settings/');
        const data = resp?.data ?? resp;
        if (data) setSettings(data as Settings);
      } catch {
        toast.error('Erreur lors du chargement des préférences.');
      }
    })();
  }, []);

  const handleCheckboxChange = (name: keyof Settings) => {
    setSettings((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      const resp = await http.patch<any>('/api/user-settings/', settings);
      const data = resp?.data ?? resp;
      if (data) {
        setSettings(data as Settings);
        toast.success('Préférences sauvegardées.');
      } else {
        toast.error('Erreur lors de la sauvegarde.');
      }
    } catch {
      toast.error('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await http.patch('/api/user-settings/', {
        download_data_requested: new Date().toISOString(),
      });

      // Use http.get with responseType: 'blob'
      const blob = await http.get<Blob>('/api/download-user-data/', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mes_donnees_utilisateur.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Téléchargement lancé.');
    } catch {
      toast.error('Impossible de télécharger les données');
    } finally {
      setDownloading(false);
    }
  };

  const confirmDeleteAccount = async () => {
    try {
      await http.patch('/api/user-settings/', {
        account_deletion_requested: new Date().toISOString(),
      });
      toast.success('Demande de suppression enregistrée.');
    } catch {
      toast.error('Erreur lors de la demande de suppression.');
    }
  };

  const requestDeletion = () => {
    if (PASSWORD_CONFIRM_DELETE) {
      setPendingAction(() => confirmDeleteAccount);
      setShowPasswordConfirm(true);
    } else {
      void confirmDeleteAccount();
    }
  };

  const verifyPassword = async (pwd: string) => {
    try {
      await http.post('/api/auth/verify-password/', { password: pwd });
      return true;
    } catch {
      toast.error('Mot de passe incorrect.');
      return false;
    }
  };

  const onConfirmPassword = async (pwd: string) => {
    const ok = await verifyPassword(pwd);
    if (ok && pendingAction) await pendingAction();
    setPendingAction(null);
    setShowPasswordConfirm(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-dark-green mb-4">Notifications</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Offres spéciales</p>
              <p className="text-sm text-gray-500">Recevoir les promotions par email</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notif_promotions}
              onChange={() => handleCheckboxChange('notif_promotions')}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Nouveaux produits</p>
              <p className="text-sm text-gray-500">Être informé des nouveautés</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notif_new_products}
              onChange={() => handleCheckboxChange('notif_new_products')}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Suivi de commande</p>
              <p className="text-sm text-gray-500">Notifications de livraison</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notif_orders}
              onChange={() => handleCheckboxChange('notif_orders')}
            />
          </div>

          <button
            onClick={saveSettings}
            disabled={loading}
            className="mt-6 bg-dark-green text-pale-yellow px-6 py-2 rounded-full font-semibold hover:bg-dark-green/90 transition-colors disabled:opacity-60"
          >
            Sauvegarder
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-dark-green mb-4">Confidentialité</h3>
        <div className="space-y-4">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="text-dark-green hover:text-medium-brown transition-colors disabled:opacity-60"
          >
            {downloading ? 'Téléchargement...' : 'Télécharger mes données'}
          </button>
          <br />
          <button
            onClick={requestDeletion}
            className="text-red-600 hover:text-red-800 transition-colors"
          >
            Supprimer mon compte
          </button>
        </div>
      </div>

      <PasswordConfirmModal
        visible={showPasswordConfirm}
        onClose={() => setShowPasswordConfirm(false)}
        onConfirm={onConfirmPassword}
      />
    </div>
  );
}
