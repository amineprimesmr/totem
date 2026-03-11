import { config } from 'dotenv';
import { resolve } from 'path';

// Charge .env du répertoire courant (packages/database après copie) ou de la racine
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '../../.env') });

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@totem.fr' },
    update: {},
    create: {
      email: 'admin@totem.fr',
      password: adminPassword,
      name: 'Admin Totem',
      role: 'ADMIN',
    },
  });
  console.log('Admin:', admin.email);

  const templates = [
    {
      key: 'NEW_OFFER_TO_CANDIDAT',
      name: 'Nouvelle offre pour le candidat',
      subject: 'Une offre correspond à votre profil - {{entreprise_nom}}',
      body: '<p>Bonjour {{prenom}},</p><p>Une nouvelle offre chez {{entreprise_nom}} correspond à votre profil.</p><p><a href="{{lien_offre}}">Voir l\'offre</a></p><p>L\'équipe Totem</p>',
    },
    {
      key: 'CANDIDAT_PROPOSED_TO_COMPANY',
      name: 'Candidat proposé à l\'entreprise',
      subject: 'Un candidat correspond à votre offre - {{candidat_nom}}',
      body: '<p>Bonjour,</p><p>Le candidat {{candidat_nom}} correspond à votre offre "{{offre_titre}}".</p><p><a href="{{lien_plateforme}}">Voir le profil</a></p><p>L\'équipe Totem</p>',
    },
    {
      key: 'INTERVIEW_SCHEDULED',
      name: 'Entretien planifié',
      subject: 'Entretien confirmé - {{date}}',
      body: '<p>Bonjour {{prenom}},</p><p>Votre entretien est confirmé le {{date}} à {{heure}}.</p><p>Lieu : {{lieu}}</p><p>L\'équipe Totem</p>',
    },
    {
      key: 'RELANCE_CANDIDAT',
      name: 'Relance candidat (sans match)',
      subject: 'Totem — On pense à vous, {{prenom}}',
      body: '<p>Bonjour {{prenom}},</p><p>Vous êtes en recherche d\'une alternance et nous n\'avons pas encore pu vous proposer d\'offre. Nous restons à l\'écoute : connectez-vous à votre espace pour voir les nouvelles offres qui correspondent à votre profil.</p><p>L\'équipe Totem</p>',
    },
    {
      key: 'RELANCE_MATCH_COMMERCIAL',
      name: 'Relance commercial (match sans réponse)',
      subject: 'Rappel : {{candidat_nom}} / {{entreprise_nom}}',
      body: '<p>Bonjour,</p><p>Le candidat {{candidat_nom}} a été proposé à l\'entreprise {{entreprise_nom}} pour l\'offre "{{offre_titre}}" il y a plus de 5 jours sans réponse.</p><p>Pensez à relancer l\'entreprise.</p><p>L\'équipe Totem</p>',
    },
    {
      key: 'MATCH_PROPOSE_CANDIDAT',
      name: 'Proposition de match au candidat (offre correspond à votre profil)',
      subject: 'Une offre vous correspond : {{offre_titre}} chez {{entreprise_nom}}',
      body: '<p>Bonjour {{prenom}},</p><p>Votre profil correspond à une offre chez <strong>{{entreprise_nom}}</strong> : <strong>{{offre_titre}}</strong>.</p><p>Souhaitez-vous que nous transmettions votre candidature ?</p><p style="margin-top:20px;"><a href="{{lien_oui}}" style="display:inline-block;background:#0d9488;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;margin-right:12px;">Oui, je suis intéressé(e)</a> <a href="{{lien_non}}" style="display:inline-block;background:#64748b;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;">Non, merci</a></p><p style="margin-top:24px;color:#64748b;font-size:14px;">L\'équipe Totem</p>',
    },
    {
      key: 'MATCH_CAMPAIGN_CANDIDATE',
      name: 'Campagne matching vers candidat',
      subject: 'Match alternance : {{offre_titre}} chez {{entreprise_nom}} ({{score}}%)',
      body: '<p>Bonjour {{prenom}},</p><p>Nous pensons que cette offre vous correspond : <strong>{{offre_titre}}</strong> chez <strong>{{entreprise_nom}}</strong>.</p><p>Score estimé: <strong>{{score}}%</strong> — Distance: <strong>{{distance_km}} km</strong>.</p><p style="margin-top:20px;"><a href="{{lien_oui}}" style="display:inline-block;background:#0d9488;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;margin-right:12px;">Oui, je suis intéressé(e)</a> <a href="{{lien_non}}" style="display:inline-block;background:#64748b;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;">Non, merci</a></p><p style="margin-top:24px;color:#64748b;font-size:14px;">L\'équipe Totem</p>',
    },
    {
      key: 'MATCH_CAMPAIGN_COMPANY',
      name: 'Campagne matching vers entreprise',
      subject: 'Profil proposé : {{candidat_nom}} pour {{offre_titre}} ({{score}}%)',
      body: '<p>Bonjour,</p><p>Nous vous proposons le profil <strong>{{candidat_nom}}</strong> pour l\'offre <strong>{{offre_titre}}</strong>.</p><p>Score estimé: <strong>{{score}}%</strong> — Distance: <strong>{{distance_km}} km</strong>.</p><p style="margin-top:20px;"><a href="{{lien_oui}}" style="display:inline-block;background:#0d9488;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;margin-right:12px;">Oui, intéressé</a> <a href="{{lien_non}}" style="display:inline-block;background:#64748b;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;">Non, merci</a></p><p style="margin-top:24px;color:#64748b;font-size:14px;">L\'équipe Totem</p>',
    },
    {
      key: 'MATCH_CAMPAIGN_RELANCE',
      name: 'Relance campagne matching',
      subject: 'Relance : retour attendu sur {{offre_titre}}',
      body: '<p>Bonjour,</p><p>Petit rappel concernant la proposition <strong>{{offre_titre}}</strong>.</p><p>Vous pouvez répondre en 1 clic :</p><p style="margin-top:20px;"><a href="{{lien_oui}}" style="display:inline-block;background:#0d9488;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;margin-right:12px;">Oui</a> <a href="{{lien_non}}" style="display:inline-block;background:#64748b;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;">Non</a></p>',
    },
  ];

  for (const t of templates) {
    await prisma.emailTemplate.upsert({
      where: { key: t.key },
      update: { subject: t.subject, body: t.body, name: t.name },
      create: t,
    });
  }
  console.log('Templates créés:', templates.length);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
