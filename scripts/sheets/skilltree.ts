import ApplicationV2 from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/client-esm/applications/api/application.mjs";
import HandlebarsApplicationMixin from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/client-esm/applications/api/handlebars-application.mjs";

export class SkillTree extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    ...ApplicationV2.DEFAULT_OPTIONS,
    template: "modules/shadowell-skilltrees/templates/skilltree.hbs",
    width: 800,
    height: 600,
    resizable: true,
    title: "Skill Tree",
  };

  constructor(options: object) {
    super(options);
  }

  get title() {
    return "Skill Tree";
  }
}