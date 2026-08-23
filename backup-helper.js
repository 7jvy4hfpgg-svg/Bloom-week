(function () {
  'use strict';

  const BACKUP_BUTTON_ID = 'bloom-backup-button';

  function lireStockage() {
    const stockage = {};

    for (let i = 0; i < localStorage.length; i++) {
      const cle = localStorage.key(i);
      stockage[cle] = localStorage.getItem(cle);
    }

    return stockage;
  }

  async function creerSauvegarde() {
    const stockage = lireStockage();

    let indexSource = '';

    try {
      const reponse = await fetch('./index.html?backup=' + Date.now(), {
        cache: 'no-store'
      });

      if (reponse.ok) {
        indexSource = await reponse.text();
      }
    } catch (e) {
      console.warn('Copie index.html impossible', e);
    }

    const sauvegarde = {
      application: 'Bloom Week',
      versionSauvegarde: 1,
      dateSauvegarde: new Date().toISOString(),
      adresse: location.href,

      donneesBloomWeek: {
        evenementsAjoutes: stockage.bloom_events_v3 || '[]',
        modificationsEvenements: stockage.bloom_event_overrides_v1 || '{}',
        taches: stockage.bloom_tasks_v2 || '[]',
        modeAlarme: stockage.bloom_alarm_mode || '',
        rappelsReportes: stockage.bloom_snoozes_v1 || '{}',
        rappelsDejaDeclenches: stockage.bloom_notified_v2 || '{}'
      },

      stockageLocalComplet: stockage,

      indexHtmlActuel: indexSource
    };

    const texte = JSON.stringify(sauvegarde, null, 2);

    const fichier = new File(
      [texte],
      'BloomWeek-SAUVEGARDE-' +
        new Date().toISOString().slice(0, 10) +
        '.json',
      { type: 'application/json' }
    );

    try {
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [fichier] })
      ) {
        await navigator.share({
          title: 'Sauvegarde Bloom Week',
          text: 'Sauvegarde complète de Bloom Week',
          files: [fichier]
        });

        alert('Sauvegarde Bloom Week créée ✓');
        return;
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
    }

    try {
      const url = URL.createObjectURL(fichier);
      const lien = document.createElement('a');

      lien.href = url;
      lien.download = fichier.name;

      document.body.appendChild(lien);
      lien.click();
      lien.remove();

      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 2000);

      alert('Sauvegarde Bloom Week créée ✓');
      return;
    } catch (e) {
      console.warn('Téléchargement impossible', e);
    }

    try {
      await navigator.clipboard.writeText(texte);

      alert(
        'Le fichier ne pouvait pas être téléchargé. ' +
        'La sauvegarde complète a été copiée dans le presse-papiers.'
      );
    } catch (e) {
      alert(
        'Impossible de créer automatiquement la sauvegarde. ' +
        'Aucune donnée Bloom Week n’a été modifiée.'
      );
    }
  }

  function ajouterBouton() {
    if (document.getElementById(BACKUP_BUTTON_ID)) return;

    const reglages = document.getElementById('settings');

    if (!reglages) {
      setTimeout(ajouterBouton, 500);
      return;
    }

    const bloc = document.createElement('div');

    bloc.style.cssText =
      'margin-top:12px;' +
      'padding:14px;' +
      'border:1px solid var(--line,#eadfda);' +
      'border-radius:18px;' +
      'background:var(--panel,#fffaf7);';

    const titre = document.createElement('b');
    titre.textContent = 'Sauvegarde de mes données';

    const texte = document.createElement('div');

    texte.textContent =
      'Sauvegarde mes événements, tâches, rappels et une copie de mon index Bloom Week.';

    texte.style.cssText =
      'font-size:11px;' +
      'color:var(--muted,#8d7a80);' +
      'line-height:1.45;' +
      'margin-top:6px;';

    const bouton = document.createElement('button');

    bouton.id = BACKUP_BUTTON_ID;
    bouton.type = 'button';
    bouton.textContent = '💾 Sauvegarder Bloom Week';

    bouton.style.cssText =
      'width:100%;' +
      'margin-top:12px;' +
      'padding:13px;' +
      'border:0;' +
      'border-radius:13px;' +
      'background:var(--accent,#9d6877);' +
      'color:white;' +
      'font:inherit;' +
      'font-weight:700;';

    bouton.addEventListener('click', creerSauvegarde);

    bloc.appendChild(titre);
    bloc.appendChild(texte);
    bloc.appendChild(bouton);

    const notifications = reglages.querySelector('.notifbox');

    if (notifications) {
      reglages.insertBefore(bloc, notifications);
    } else {
      reglages.appendChild(bloc);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ajouterBouton);
  } else {
    ajouterBouton();
  }
})();
