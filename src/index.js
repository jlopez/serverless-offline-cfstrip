const _ = require('lodash');

class OfflineCloudFormationStrip {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.pluginName = 'serverless-offline-cfstrip';

    if (serverless.pluginManager.cliCommands[0] !== 'offline') return;

    this.variableRegex = RegExp(serverless.service.provider.variableSyntax);
    this.cfRefSyntax = serverless.variables.cfRefSyntax;

    this.config = serverless.service.custom[this.pluginName] || {};
    const regexFlags = this.config.regexFlags || 'i';
    this.replacements = _.chain(this.config.replacements)
      .toPairs()
      .map(([k, v]) => [new RegExp(k, regexFlags), v])
      .value();

    this.replaceCloudFormationVariables(serverless.service);
  }

  debug(msg) {
    if (process.env.SLS_DEBUG) {
      this.serverless.cli.log(msg, this.pluginName);
    }
  }

  replaceCloudFormationVariables(node) {
    _.chain(node)
      .forEach((v, k) => {
        if (k === 'serverless');
        else if (_.isString(v)) {
          // eslint-disable-next-line no-param-reassign
          node[k] = this.replaceCloudFormationVariable(v);
        } else if (_.isObject(v) && !_.isDate(v) && !_.isRegExp(v) && !_.isFunction(v)) {
          this.replaceCloudFormationVariables(node[k]);
        }
      })
      .value();
  }

  replaceCloudFormationVariable(original) {
    if (!original.includes('$')) return original;

    const placeholders = {};
    const restore = (str) => _.reduce(placeholders,
      (result, variable, placeholder) => result.replace(placeholder, variable), str);

    let workString = original;
    let ix = 0;
    for (;;) {
      const match = workString.match(this.variableRegex);
      if (!match) break;
      const [variable, contents] = match;
      const cfMatch = contents.match(this.cfRefSyntax);
      if (!cfMatch) {
        const placeholder = `@@${ix}@@`;
        placeholders[placeholder] = variable;
        workString = workString.replace(variable, placeholder);
        ix += 1;
      } else {
        const region = cfMatch[1] || this.options.region || this.serverless.service.provider.region;
        const [stack, output] = contents.split(':', 2)[1].split('.', 2);
        const replacement = this.getCloudFormationReplacement(region, stack, output);
        this.debug(`Replacing ${restore(variable)} with ${restore(replacement)}`);
        workString = workString.replace(variable, replacement);
      }
    }
    return restore(workString);
  }

  getCloudFormationReplacement(region, stack, output) {
    return _.chain(this.replacements)
      .filter(([regex]) => output.match(regex))
      .map(([, template]) => (template
        .replace('$REGION', region)
        .replace('$STACK', stack)
        .replace('$OUTPUT', output)
      ))
      .first()
      .value() || stack;
  }
}

module.exports = OfflineCloudFormationStrip;
