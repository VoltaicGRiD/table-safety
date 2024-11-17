"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillTree = void 0;
const application_mjs_1 = __importDefault(require("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client-esm/applications/api/application.mjs"));
const handlebars_application_mjs_1 = __importDefault(require("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client-esm/applications/api/handlebars-application.mjs"));
class SkillTree extends (0, handlebars_application_mjs_1.default)(application_mjs_1.default) {
    static DEFAULT_OPTIONS = {
        ...application_mjs_1.default.DEFAULT_OPTIONS,
        template: "modules/shadowell-skilltrees/templates/skilltree.hbs",
        width: 800,
        height: 600,
        resizable: true,
        title: "Skill Tree",
    };
    constructor(options) {
        super(options);
    }
    get title() {
        return "Skill Tree";
    }
}
exports.SkillTree = SkillTree;
