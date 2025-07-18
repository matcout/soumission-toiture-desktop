// SoumissionPDF.jsx - Version optimisée SANS ligne d'entête + adresse courte + MULTILINGUE
import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image, Font } from '@react-pdf/renderer';
import { FileText } from 'lucide-react';

// Styles optimisés pour le PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    paddingTop: 35,
    paddingBottom: 25,
    paddingHorizontal: 60,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  // Bannière SANS ligne de séparation
  headerBanner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15, // Augmenté légèrement car pas de ligne
    paddingBottom: 5,
    width: '100%',
  },
  bannerImage: {
    width: '100%',
    height: 'auto',
    maxHeight: 100,
    minHeight: 75,
  },
  
  // Section client
  clientSection: {
    marginTop: 5, // Réduit car pas de ligne
  },
  clientRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
    paddingLeft: 30,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 45,
    fontSize: 9,
  },
  underlineField: {
    flex: 1,
    borderBottomWidth: 0.2, // ✅ MODIFICATION: Ligne moins épaisse
    borderBottomColor: '#000',
    marginLeft: 5,
    paddingBottom: 1,
    minHeight: 12,
  },
  // ✅ NOUVEAU: Ligne raccourcie pour les 3 premières lignes client
  underlineFieldShort: {
    width: '60%', // ✅ MODIFICATION: Seulement 60% de largeur au lieu de flex: 1
    borderBottomWidth: 0.2,
    borderBottomColor: '#000',
    marginLeft: 5,
    paddingBottom: 1,
    minHeight: 12,
  },
   // ✅ AJOUTER un nouveau style pour les lignes courtes côté droit
  underlineFieldShortRight: {
    width: '50%', // Ajustez ce pourcentage selon vos besoins (50%, 60%, 70%, etc.)
    borderBottomWidth: 0.2,
    borderBottomColor: '#000',
    marginLeft: 5,
    paddingBottom: 1,
    minHeight: 12,
  },
  emptyLine: {
    borderBottomWidth: 0.2, // ✅ MODIFICATION: Ligne moins épaisse
    borderBottomColor: '#000',
    marginBottom: 5,
    minHeight: 12,
  },
  // Cases à cocher
  checkboxSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
    gap: 60,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: '#000',
    marginRight: 5,
  },
  checkboxLabel: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  // Contenu principal
  mainText: {
    marginBottom: 8,
    lineHeight: 1.3,
    fontSize: 9,
  },
  fieldLabel: {
    fontWeight: 'bold',
    textDecoration: 'underline',
    fontSize: 9,
  },
  // ✅ NOUVEAU: Adresse avec ligne plus courte (30% au lieu de 100%)
  adresseRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  adresseUnderlineShort: {
    width: '30%', // ✅ MODIFICATION: 30% au lieu de 50% - ENCORE PLUS COURT
    borderBottomWidth: 0.2, // ✅ MODIFICATION: Ligne moins épaisse
    borderBottomColor: '#000',
    paddingBottom: 1,
    marginLeft: 10,
  },
  // Superficie
  superficieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  superficieUnderline: {
    width: '28%', // ✅ MODIFICATION: Même largeur que l'adresse
    borderBottomWidth: 0.2, // ✅ MODIFICATION: Ligne moins épaisse
    borderBottomColor: '#000',
    paddingBottom: 1,
    marginLeft: 10,
  },
  // Liste de travaux
  workSection: {
    marginTop: 6,
  },
  workItem: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingLeft: 15,
  },
  itemLetter: {
    width: 18,
    fontSize: 9,
  },
  itemText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.15,
  },
  // Section "Autres" avec ligne d'écriture
  autresSection: {
    marginTop: 12, // ✅ MODIFICATION: Plus d'espace (était 6)
    marginBottom: 4,
  },
  autresLine: {
    borderBottomWidth: 0.2, // ✅ MODIFICATION: Ligne moins épaisse
    borderBottomColor: '#000',
    marginTop: 3,
    marginBottom: 2,
    minHeight: 12,
  },
  // Sections compactes
  sectionTitle: {
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginTop: 8,
    marginBottom: 4,
    fontSize: 9,
  },
  bulletPoint: {
    marginLeft: 25,
    marginBottom: 2,
    lineHeight: 1.2,
    fontSize: 9,
  },
  responsabiliteText: {
    marginBottom: 4,
    fontSize: 9,
  },
  precautionText: {
    marginBottom: 6,
    lineHeight: 1.2,
    fontSize: 9,
  },
  // ✅ Tableau des prix - MODIFICATIONS PRINCIPALES
  priceSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    marginBottom: 6, // ✅ MODIFICATION: Réduit l'espace entre les lignes
    alignItems: 'center',
  },
  priceLabel: {
    width: 180, // ✅ MODIFICATION: Plus large pour les labels
    fontSize: 9,
  },
  priceLine: {
    width: '25%', // ✅ MODIFICATION: Plus court (30% au lieu de 40%)
    borderBottomWidth: 0.2, // ✅ MODIFICATION: Plus fin (0.2 au lieu de 0.5)
    borderBottomColor: '#000',
    marginLeft: 15, // ✅ MODIFICATION: Moins d'espace
    textAlign: 'left', // ✅ MODIFICATION: Prix à gauche
    paddingBottom: 1, // ✅ MODIFICATION: Moins de padding
    paddingLeft: 5, // ✅ MODIFICATION: Padding à gauche pour les prix
    minHeight: 14, // ✅ MODIFICATION: Moins de hauteur
  },
  totalRow: {
    fontWeight: 'bold',
    marginTop: 3, // ✅ MODIFICATION: Moins de séparation pour TOTAL
  },
  permisNote: {
    marginBottom: 4,
    fontSize: 9,
  },
  validiteNote: {
    marginBottom: 6,
    fontSize: 9,
  },
  // Garanties
  guaranteeSection: {
    marginTop: 6,
  },
  guaranteeLine: {
    marginBottom: 2,
    fontSize: 9,
    lineHeight: 1.2,
  },
  bold: {
    fontWeight: 'bold',
  },
  underline: {
    textDecoration: 'underline',
  },
  // Signatures
  signatureSection: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 30,
  },
  signatureColumn: {
    flex: 1,
  },
  signatureItem: {
    marginBottom: 18,
  },
  signatureLabel: {
    fontSize: 9,
    marginBottom: 3,
  },
  signatureLine: {
    borderBottomWidth: 0.3, // ✅ MODIFICATION: Ligne moins épaisse
    borderBottomColor: '#000',
    minHeight: 15,
  },
});

// Composant Document PDF optimisé avec support multilingue
const SoumissionDocument = ({ data, language = 'fr' }) => {
  const formatCurrency = (amount) => {
    return amount.toLocaleString(language === 'fr' ? 'fr-CA' : 'en-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA');
  };

  // Labels traduits
  const labels = {
    fr: {
      client: 'Client',
      telephone: 'Tél.',
      courriel: 'Courriel',
      date: 'Date',
      soumission: 'SOUMISSION',
      contrat: 'CONTRAT',
      addressWorks: 'Adresse des travaux',
      surfaceWorks: 'Superficie des travaux',
      descriptionWorks: 'Description des travaux',
      others: 'Autres',
      responsibility: 'RESPONSABILITÉS',
      precautions: 'PRÉCAUTIONS',
      priceContract: 'PRIX DE CE CONTRAT',
      price: 'Prix',
      total: 'TOTAL',
      guarantee: 'GARANTIE',
      dateSignature: 'Date de la Signature',
      dateWorks: 'Date des travaux',
      mainText: 'Il nous fait plaisir de vous soumettre notre prix pour les travaux à effectuer aux adresses suivantes :',
      validity: 'Cette soumission est valide pour une période de (15) jours.',
      permits: 'N.B. Tous les permis d\'occupation seront aux frais du propriétaire.',
      provides: 'fournis une garantie de',
      years: 'ans',
      sq2Including: 'pi² incluant les relevés',
      warranty: 'warranty'
    },
    en: {
      client: 'Client',
      telephone: 'Tel.',
      courriel: 'Email',
      date: 'Date',
      soumission: 'QUOTATION',
      contrat: 'CONTRACT',
      addressWorks: 'Address of works',
      surfaceWorks: 'Surfaces of works',
      descriptionWorks: 'Description of work',
      others: 'Others',
      responsibility: 'RESPONSIBILITY',
      precautions: 'PRECAUTIONS',
      priceContract: 'PRICE OF THIS CONTRACT',
      price: 'Price',
      total: 'TOTAL',
      guarantee: 'GUARANTEE',
      dateSignature: 'Date of Signature',
      dateWorks: 'Date of Works',
      mainText: 'It is a pleasure to give you a quotation to have your roof change at the above-mentioned address :',
      validity: 'This submission is valid for a period of thirty(15)days.',
      permits: 'N.B. Every occupation permit will be charge of the owner.',
      provides: 'provides a',
      years: 'year',
      sq2Including: 'sq2 including parapet',
      warranty: 'warranty'
    }
  };

  const currentLabels = labels[language];

  // ✅ NOUVELLE FONCTION: Répartir le texte "Autres" sur 3 lignes automatiquement
  const repartirTexteSur3Lignes = (texteComplet) => {
    if (!texteComplet) {
      return { ligne1: '', ligne2: '', ligne3: '' };
    }

    // Si on a déjà les 3 lignes séparées (du formulaire PDFPreviewForm)
    if (data.autres && (data.autres.ligne1 || data.autres.ligne2 || data.autres.ligne3)) {
      return {
        ligne1: data.autres.ligne1 || '',
        ligne2: data.autres.ligne2 || '',
        ligne3: data.autres.ligne3 || ''
      };
    }

    // Sinon, répartir le texte automatiquement par caractères
    const maxCharsParLigne = 85; // Environ 85 caractères par ligne dans le PDF
    const mots = texteComplet.split(' ');
    
    let ligne1 = '';
    let ligne2 = '';
    let ligne3 = '';
    
    // Répartir les mots intelligemment selon la longueur
    for (let i = 0; i < mots.length; i++) {
      const mot = mots[i];
      const ajoutAvecEspace = (ligne1 ? ' ' : '') + mot;
      
      if ((ligne1 + ajoutAvecEspace).length <= maxCharsParLigne) {
        ligne1 += ajoutAvecEspace;
      } else {
        const ajoutAvecEspace2 = (ligne2 ? ' ' : '') + mot;
        if ((ligne2 + ajoutAvecEspace2).length <= maxCharsParLigne) {
          ligne2 += ajoutAvecEspace2;
        } else {
          ligne3 += (ligne3 ? ' ' : '') + mot;
        }
      }
    }
    
    return { ligne1, ligne2, ligne3 };
  };

  // ✅ MODIFICATION PRINCIPALE: Utiliser soumission personnalisée en priorité
  const sousTotal = data.customSubmission?.total || data.results?.sousTotal || 0;
  const tps = sousTotal * 0.05;
  const tvq = sousTotal * 0.09975;
  const total = sousTotal + tps + tvq;

  // ✅ Préparer le texte "Autres" réparti
  const autresReparti = repartirTexteSur3Lignes(data.autresTexte);

  // ✅ COMPOSANT BANNIÈRE SANS LIGNE
  const HeaderBanner = () => (
    <View style={styles.headerBanner}>
      <Image 
        src="./logo-toitpro.jpg" 
        style={styles.bannerImage}
      />
    </View>
  );

  return (
    <Document>
      {/* PAGE 1 */}
      <Page size="LETTER" style={styles.page}>
        <HeaderBanner />

        {/* ✅ Section Client MISE À JOUR avec nom2, nom3, telephone2 */}
        <View style={styles.clientSection}>
          <View style={styles.clientRow}>
            <View style={styles.leftColumn}>
              <View style={styles.fieldRow}>
                <Text style={styles.label}>{currentLabels.client} :</Text>
                <View style={styles.underlineField}>
                  <Text>{data.client?.nom || ' '}</Text>
                </View>
              </View>
              {/* ✅ NOUVEAU: Ligne 2 du client */}
              <View style={styles.fieldRow}>
                <Text style={styles.label}></Text>
                <View style={styles.underlineField}>
                  <Text>{data.client?.nom2 || ' '}</Text>
                </View>
              </View>
              {/* ✅ NOUVEAU: Ligne 3 du client */}
              <View style={styles.fieldRow}>
                <Text style={styles.label}></Text>
                <View style={styles.underlineField}>
                  <Text>{data.client?.nom3 || ' '}</Text>
                </View>
              </View>
            </View>
            <View style={styles.rightColumn}>
              <View style={styles.fieldRow}>
                <Text style={styles.label}>{currentLabels.telephone} :</Text>
                <View style={styles.underlineFieldShortRight}>
                  <Text>{data.client?.telephone || ' '}</Text>
                </View>
              </View>
              {/* ✅ NOUVEAU: Téléphone 2 */}
              <View style={styles.fieldRow}>
                <Text style={styles.label}>{currentLabels.telephone} :</Text>
                <View style={styles.underlineFieldShortRight}>
                  <Text>{data.client?.telephone2 || ' '}</Text>
                </View>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.label}>{currentLabels.courriel} :</Text>
                <View style={styles.underlineFieldShortRight}>
                  <Text>{data.client?.courriel || ' '}</Text>
                </View>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.label}>{currentLabels.date} :</Text>
                <View style={styles.underlineFieldShortRight}>
                  <Text>{data.dateContrat ? formatDate(new Date(data.dateContrat)) : formatDate(new Date())}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Cases SOUMISSION / CONTRAT */}
        <View style={styles.checkboxSection}>
          <View style={styles.checkboxItem}>
            <View style={styles.checkbox} />
            <Text style={styles.checkboxLabel}>{currentLabels.soumission}</Text>
          </View>
          <View style={styles.checkboxItem}>
            <View style={styles.checkbox} />
            <Text style={styles.checkboxLabel}>{currentLabels.contrat}</Text>
          </View>
        </View>

        {/* Texte principal */}
        <Text style={styles.mainText}>
          {currentLabels.mainText}
        </Text>

        {/* ✅ ADRESSE AVEC LIGNE PLUS COURTE */}
        <View style={styles.adresseRow}>
          <Text style={styles.fieldLabel}>{currentLabels.addressWorks} :</Text>
          <View style={styles.adresseUnderlineShort}>
            <Text>{data.client?.adresse || ' '}</Text>
          </View>
        </View>

        {/* Superficie */}
        <View style={styles.superficieRow}>
          <Text style={styles.fieldLabel}>{currentLabels.surfaceWorks} :</Text>
          <View style={styles.superficieUnderline}>
            <Text>{Math.round(data.superficie?.totale || 0)} {currentLabels.sq2Including}</Text>
          </View>
        </View>

        <Text style={[styles.fieldLabel, { marginTop: 4, marginBottom: 4 }]}>{currentLabels.descriptionWorks} :</Text>

        {/* Liste des travaux */}
        <View style={styles.workSection}>
          {data.travaux?.map((travail, index) => (
            <View key={index} style={styles.workItem}>
              <Text style={styles.itemLetter}>{travail.lettre}</Text>
              <Text style={styles.itemText}>{travail.texte}</Text>
            </View>
          )) || (
            // Travaux par défaut selon la langue
            language === 'fr' ? (
              <>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>a)</Text>
                  <Text style={styles.itemText}>Enlever les solins existants et en disposer.</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>b)</Text>
                  <Text style={styles.itemText}>Arracher la toiture jusqu'au pontage de bois.</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>c)</Text>
                  <Text style={styles.itemText}>Vérifier le pontage</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>d)</Text>
                  <Text style={styles.itemText}>Si nous devons changer du bois, nous en changerons jusqu'à un équivalent de 32 pieds carrés, si le bois est plus endommagé, nous vous en aviserons avant de débuter les travaux. Le cout sera de 4,50$ le pi2</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>e)</Text>
                  <Text style={styles.itemText}>Fournir et installer un panneau de fibre de bois Secure panne ½ 4X8 (ignifuge).</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>f)</Text>
                  <Text style={styles.itemText}>Fournir et installer une sous-couche de membrane élastomère 180 fast N Stick.</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>g)</Text>
                  <Text style={styles.itemText}>Fournir et installer 1 pli de membrane armorbond180 sur les parapets.</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>h)</Text>
                  <Text style={styles.itemText}>Fournir et installer de nouveaux drains de cuivre 16 onces avec panier.</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>i)</Text>
                  <Text style={styles.itemText}>Fournir et installer de nouveaux évents de plomberie en aluminium.</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>j)</Text>
                  <Text style={styles.itemText}>Fournir et installer de nouveaux ventilateurs Optimum.</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>k)</Text>
                  <Text style={styles.itemText}>Fournir et installer une membrane élastomère de finition 250 soudé couleur blanche (ArmourCool) avec indice IRS de 82.</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>l)</Text>
                  <Text style={styles.itemText}>Fournir et installer de nouveaux solins.</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>m)</Text>
                  <Text style={styles.itemText}>Calfeutrer tous les joints avec du Mulco Supra Extra</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>n)</Text>
                  <Text style={styles.itemText}>Nettoyer les débris et laisser les lieux propres.</Text>
                </View>
              </>
            ) : (
              // Version anglaise
              <>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>a)</Text>
                  <Text style={styles.itemText}>Remove the existent flashing and get rid of it.</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>b)</Text>
                  <Text style={styles.itemText}>Tear away the old roof up to the wooden deck.</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>c)</Text>
                  <Text style={styles.itemText}>Verify the Deck.</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>d)</Text>
                  <Text style={styles.itemText}>If we have to change some wood, we will change it up to an equivalent of 32 square feet, if the wood is more damaged, we will inform you about it before beginning the works. The price will be 4.50$ sq2</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>e)</Text>
                  <Text style={styles.itemText}>Supply and install a tentes secure pan ½ 4X8 (fireproof) on the total surface.</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>f)</Text>
                  <Text style={styles.itemText}>Supply and install 1 fold of sub layer elastomer membrane 180 Fast N Stick.</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>g)</Text>
                  <Text style={styles.itemText}>Supply and install 1 fold of armorbound flash on the parapet.</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>h)</Text>
                  <Text style={styles.itemText}>Supply and install new brass drains 16 ounces with basket.</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>i)</Text>
                  <Text style={styles.itemText}>Supply and install new aluminium plumbing ventilation.</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>j)</Text>
                  <Text style={styles.itemText}>Supply and install new Optimum Ventilator.</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>k)</Text>
                  <Text style={styles.itemText}>Supply and install 1 fold of finishing elastomer membrane 250cap welded white color (ArmourCool) 82 IRS require at Montréal.</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>l)</Text>
                  <Text style={styles.itemText}>Supply and install new flashing</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>m)</Text>
                  <Text style={styles.itemText}>Seal all the joints with Mulco Supra Extra</Text>
                </View>
                <View style={styles.workItem}>
                  <Text style={styles.itemLetter}>n)</Text>
                  <Text style={styles.itemText}>Clean fragments and leave the place clean.</Text>
                </View>
              </>
            )
          )}
        </View>

        {/* Section "Autres" avec répartition automatique */}
        <View style={styles.autresSection}>
          <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{currentLabels.others}:</Text>
          <View style={styles.autresLine}>
            <Text style={{ fontSize: 9 }}>{autresReparti.ligne1}</Text>
          </View>
          <View style={styles.autresLine}>
            <Text style={{ fontSize: 9 }}>{autresReparti.ligne2}</Text>
          </View>
          <View style={styles.autresLine}>
            <Text style={{ fontSize: 9 }}>{autresReparti.ligne3}</Text>
          </View>
        </View>
      </Page>

      {/* PAGE 2 - RESPONSABILITÉS, PRIX ET SIGNATURES */}
      <Page size="LETTER" style={styles.page}>
        <HeaderBanner />

        {/* RESPONSABILITÉS */}
        <Text style={styles.sectionTitle}>{currentLabels.responsibility} :</Text>
        <Text style={styles.responsabiliteText}>
          <Text style={styles.bold}>Toitpro</Text> {data.responsabilites?.intro || (language === 'fr' ? "n'assume aucune responsabilité pour les items suivant." : "does not assume any responsibility for these items.")}
        </Text>
        <Text style={styles.bulletPoint}>• {data.responsabilites?.point1 || (language === 'fr' ? "Problème relier au drain et évent de plomberie qui aurait pour cause un objet qui ferait obstruction au bon fonctionnement." : "Probleme related to vent pipe or drain that would have for cause any obstructing objects that could get inside.")}</Text>
        <Text style={styles.bulletPoint}>• {data.responsabilites?.point2 || (language === 'fr' ? "Défauts de structure qui pourrait occasionner des rétentions d'eau sur la surface de la toiture du a de mauvaise pente." : "Structural defects which could cause water retention on the surface of the roof due to poor slope.")}</Text>

        {/* PRÉCAUTIONS */}
        <Text style={styles.sectionTitle}>{currentLabels.precautions} :</Text>
        <Text style={styles.precautionText}>
          <Text style={styles.bold}>Toitpro</Text> {data.precautions || (language === 'fr' ? "ne se tient aucunement responsable de la poussière qui pourrait tomber lors des travaux de toiture. Le propriétaire de l'immeuble devra avertir les locataires de fermer toutes ouvertures dans les logements lors de la réfection de la toiture ainsi que déplacer tous véhiculent autour de la bâtisse." : "is not responsible if there is some dust that falls down on car. It is the owner's responsibilities to inform the tenants to move the vehicles and leave all the window close so dust won't enter their home.")}
        </Text>

        {/* ✅ PRIX DE CE CONTRAT - LIGNES PLUS FINES ET PLUS COURTES */}
        <View style={styles.priceSection}>
          <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>{currentLabels.priceContract}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{currentLabels.price}</Text>
            <View style={styles.priceLine}>
              <Text>{formatCurrency(sousTotal)}</Text>
            </View>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>T.P.S 5% 820100337 RT</Text>
            <View style={styles.priceLine}>
              <Text>{formatCurrency(tps)}</Text>
            </View>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>T.V.Q 9.975% 1220121905 TQ</Text>
            <View style={styles.priceLine}>
              <Text>{formatCurrency(tvq)}</Text>
            </View>
          </View>
          
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={[styles.priceLabel, styles.bold]}>{currentLabels.total}</Text>
            <View style={styles.priceLine}>
              <Text style={styles.bold}>{formatCurrency(total)}</Text>
            </View>
          </View>
        </View>

        {/* Notes validité et permis */}
        <Text style={styles.validiteNote}>{currentLabels.validity}</Text>
        <Text style={styles.permisNote}>{currentLabels.permits}</Text>

        {/* GARANTIE */}
        <View style={styles.guaranteeSection}>
          <Text style={styles.sectionTitle}>{currentLabels.guarantee} :</Text>
          <Text style={styles.guaranteeLine}>
            <Text style={styles.bold}>Toitpro</Text> {currentLabels.provides} <Text style={[styles.bold, styles.underline]}>{data.garanties?.toitpro?.duree || "10"} {currentLabels.years}</Text> {language === 'fr' ? (data.garanties?.toitpro?.type || "sur les travaux exécutés") : (data.garanties?.toitpro?.type || "warranty on the work performed")}.
          </Text>
          <Text style={styles.guaranteeLine}>
            <Text style={styles.bold}>IKO</Text> {currentLabels.provides} <Text style={[styles.bold, styles.underline]}>{data.garanties?.iko?.duree || "20"} {currentLabels.years} {language === 'fr' ? (data.garanties?.iko?.type || "limitée") : "limited"}</Text> {language === 'fr' ? (data.garanties?.iko?.type || "sur la membrane utilisée") : "warranty on the membrane used"}.
          </Text>
          <Text style={[styles.guaranteeLine, styles.bold]}>{data.garanties?.rbq || "RBQ 5668-2792-01"}</Text>
          <Text style={[styles.guaranteeLine, styles.bold]}>{data.garanties?.assurance || (language === 'fr' ? "Assurance Responsabilité 2 000 000$" : "Liability Insurance $2,000,000")}</Text>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureColumn}>
            <View style={styles.signatureItem}>
              <Text style={styles.signatureLabel}>{currentLabels.dateSignature}</Text>
              <View style={styles.signatureLine} />
            </View>
            <View style={styles.signatureItem}>
              <Text style={styles.signatureLabel}>{language === 'fr' ? 'Client' : 'Client'}</Text>
              <View style={styles.signatureLine} />
            </View>
          </View>
          
          <View style={styles.signatureColumn}>
            <View style={styles.signatureItem}>
              <Text style={styles.signatureLabel}>{currentLabels.dateWorks}</Text>
              <View style={styles.signatureLine} />
            </View>
            <View style={styles.signatureItem}>
              <Text style={styles.signatureLabel}>{language === 'fr' ? 'Toitpro' : 'Toitpro inc.'}</Text>
              <View style={styles.signatureLine} />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// ✅ Composant pour intégrer dans CalculatorView - MISE À JOUR avec support multilingue
export const SoumissionPDFButton = ({ calculationData, submissionData, onOpenPDFForm, customTotal, customValues }) => {
  // Combiner toutes les données nécessaires
  const pdfData = {
    client: submissionData?.client || {},
    superficie: {
      totale: (calculationData?.inputs?.superficie || 0) + (calculationData?.inputs?.parapets || 0)
    },
    inputs: calculationData?.inputs || {},
    results: calculationData?.results || {},
    // ✅ NOUVEAU: Inclure le customTotal actuel si disponible
    customSubmission: customTotal && parseFloat(customTotal) > 0 ? {
      total: parseFloat(customTotal),
      ...customValues
    } : calculationData?.customSubmission,
    notes: submissionData?.notes || '',
    // ✅ NOUVEAU: Préparer la section "Autres" vide pour modification
    autres: {
      ligne1: '',
      ligne2: '',
      ligne3: ''
    }
  };

  return (
    <button
      onClick={() => onOpenPDFForm(pdfData)}
      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
    >
      <FileText className="w-4 h-4 mr-2" />
      Préparer PDF
    </button>
  );
};

export default SoumissionDocument;