const { default: axios } = require('axios');
const db = require('../../db');
const { SlashCommandBuilder, ComponentType } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Creacion del Embed
const createEmbed = (manga) => {
  //Conseguir filename del cover art

  const exampleEmbed = new EmbedBuilder()
    .setColor([255, 255, 255])
    .setTitle(manga.attributes.title.en)
    .addFields(
      { name: 'Author', value: manga.relationships[0].attributes.name, inline: true },
      { name: 'Status', value: manga.attributes.status, inline: true },
      {
        name: 'Chapters',
        value: manga.attributes.lastChapter ? manga.attributes.lastChapter : 'N/A',
        inline: true,
      },
    )
    .setURL('https://mangadex.org/title/' + manga.id + '/');

  return exampleEmbed;
};

// Comando

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buscar-manga')
    .setDescription('Busca un manga para leer')
    .addStringOption((option) =>
      option.setName('titulo').setDescription('Titulo del manga a buscar').setRequired(true),
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const mangaTitulo = interaction.options.getString('titulo');
      const { data } = await axios.get(
        'https://api.mangadex.org/manga/?includes[]=author&includes[]=artist&includes[]=cover_art',
        {
          params: {
            title: mangaTitulo,
          },
        },
      );

      const manga = data.data.map((manga) => {
        return createEmbed(manga);
      });

      const mangas = data.data.length;
      if (mangas === 0) return await interaction.editReply('Ingresa un titulo valido');

      //Botones
      const next = new ButtonBuilder()
        .setCustomId('next')
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(false);

      const back = new ButtonBuilder()
        .setCustomId('back')
        .setEmoji('⬅️')
        // .setLabel('')
        .setStyle(ButtonStyle.Secondary);

      const index = new ButtonBuilder()
        .setCustomId('index')
        .setLabel(`1/${mangas}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);

      const close = new ButtonBuilder()
        .setCustomId('close')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Secondary);

      const read = new ButtonBuilder()
        .setCustomId('read')
        .setLabel('Añadir a Leidos')
        .setStyle(ButtonStyle.Secondary);

      const leer = new ButtonBuilder()
        .setCustomId('leer')
        .setLabel('Leer ahora')
        .setStyle(ButtonStyle.Secondary);

      const toBeRead = new ButtonBuilder()
        .setCustomId('tbr')
        .setLabel('Añadir a Por leer')
        .setStyle(ButtonStyle.Secondary);

      // Funcionamiento botones

      const row = new ActionRowBuilder().addComponents(back, index, next, close);
      const row1 = new ActionRowBuilder().addComponents(leer, read, toBeRead);
      let counter = 0;
      const response = await interaction.editReply({
        embeds: [manga[0]],
        components: [row, row1],
        fetchReply: true,
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 20_000_000,
      });

      collector.on('collect', async (i) => {
        const counterStop = mangas - 1;

        //Boton siguiente
        if (i.customId === 'next') {
          next.setDisabled(false);
          counter++;

          //Limite
          if (counter >= counterStop) {
            next.setDisabled(true);
            index.setLabel(`${counter + 1}/${mangas}`);
            i.update({
              embeds: [manga[counter]],
              components: [row, row1],
            });

            //Puede seguir
          } else if (counter < mangas) {
            next.setDisabled(false);
            index.setLabel(`${counter + 1}/${mangas}`);
            i.update({
              embeds: [manga[counter]],
              components: [row, row1],
            });
          }
        }

        //Boton atras
        if (i.customId === 'back') {
          next.setDisabled(false);

          //Si el contador es igual a cero, no puede ir mas atras
          if (counter === 0) {
            i.update({
              embeds: [manga[counter]],
              components: [row, row1],
            });
          }
          //Si el contador es mas de cero, puede ir hacia atras
          else if (counter >= 1) {
            counter--;
            index.setLabel(`${counter + 1}/${mangas}`);
            i.update({
              embeds: [manga[counter]],
              components: [row, row1],
            });
          }
        }

        //Boton cerrar
        if (i.customId === 'close') {
          i.reply('Se ha cerrado la pagina');
        }

        // Botones para Guardar en base de datos
        //-  Leyendo
        if (i.customId === 'leer') {
          try {
            const mangadb = manga[counter].data.title;
            const status = 'leyendo';
            const user_id = interaction.user.id;
            const statement = db.prepare(`
      INSERT INTO mangas (mangadb, status, user_id) 
      VALUES (?, ?, ?)
      `);
            statement.run(mangadb, status, user_id);
            await i.reply(`<@${interaction.user.id}> Manga ${mangadb} se ha guardado en Leyendo`);
          } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
              await i.reply(`<@${interaction.user.id}> Ya has guardado este manga.`);
            }
            console.log(error);
          }
        }

        //-Leidos
        if (i.customId === 'read') {
          console.log(manga[counter].data.title);
          try {
            const mangadb = manga[counter].data.title;
            const status = 'completado';
            const user_id = interaction.user.id;
            const statement = db.prepare(`
      INSERT INTO mangas (mangadb, status, user_id) 
      VALUES (?, ?, ?)
      `);
            statement.run(mangadb, status, user_id);
            await i.reply(`<@${interaction.user.id}> Manga ${mangadb} se ha guardado en Leidos`);
          } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
              await i.reply(`<@${interaction.user.id}> Ya has guardado este manga.`);
            }
            console.log(error);
          }
        }

        //-Por leer
        if (i.customId === 'tbr') {
          try {
            const mangadb = manga[counter].data.title;
            const status = 'por leer';
            const user_id = interaction.user.id;
            const statement = db.prepare(`
      INSERT INTO mangas (mangadb, status, user_id) 
      VALUES (?, ?, ?)
      `);
            statement.run(mangadb, status, user_id);
            await i.reply(`<@${interaction.user.id}> Manga ${mangadb} se ha guardado en Por leer`);
          } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
              await i.reply(`<@${interaction.user.id}> Ya has guardado este manga.`);
            }
            console.log(error);
          }
        }
      });

      // Errores
    } catch (error) {
      await interaction.editReply(`<@${interaction.user.id}>Hubo un error 😥`);
      console.log(error.message);
    }
  },
};
