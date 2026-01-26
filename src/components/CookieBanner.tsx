import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) {
      setVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const refuseCookies = () => {
    localStorage.setItem("cookie-consent", "refused");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
        <p className="text-sm">
          Nous utilisons des cookies pour améliorer votre expérience.
        </p>
        <div className="flex gap-2">
          <button
            onClick={acceptCookies}
            className="bg-green-600 px-4 py-2 rounded"
          >
            Accepter
          </button>
          <button
            onClick={refuseCookies}
            className="bg-red-600 px-4 py-2 rounded"
          >
            Refuser
          </button>
        </div>
      </div>
    </div>
  );
}
