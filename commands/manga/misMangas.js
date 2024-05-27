const { SlashCommandBuilder } = require('discord.js');
const db = require('../../db');
const { EmbedBuilder } = require('discord.js');

const createEmbed = (manga) => {
  const exampleEmbed = new EmbedBuilder()
    .setColor([255, 0, 0])
    .setTitle(manga.mangadb)
    .addFields({ name: 'Status', value: manga.status, inline: true });

  return exampleEmbed;
};
module.exports = {
  data: new SlashCommandBuilder()
    .setName('mis-mangas')
    .setDescription('Muestra los mangas que se han guardado')
    .addStringOption((option) =>
      option
        .setName('categoria')
        .setDescription('categoria de tus mangas guardados')
        .setRequired(true)
        .addChoices(
          { name: 'Leyendo', value: 'leyendo' },
          { name: 'Leidos', value: 'completado' },
          { name: 'Por leer', value: 'por leer' },
        ),
    ),
  async execute(interaction) {
    const categoria = interaction.options.getString('categoria');
    try {
      const mangas = db
        .prepare(
          `
      SELECT mangas.mangadb, mangas.status, mangas.user_id  FROM mangas
      WHERE user_id = ? AND status = ?
      `,
        )
        .all(interaction.user.id, categoria);

      const manga = mangas.map((manga) => {
        return createEmbed(manga);
      });
      if (mangas.length === 0) {
        await interaction.editReply({
          content: 'No tienes mangas en esta categoria',
        });
      }
      await interaction.reply({ embeds: manga });
    } catch (error) {
      console.log(error);
      await interaction.reply('Error!');
    }
  },
};
