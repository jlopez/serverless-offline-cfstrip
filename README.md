# Serverless Cloud Formation Strip

This [Serverless](https://github.com/serverless/serverless) plugin replaces
all cloud formation references in a `serverless.yml` file with hardcoded values
when running in offline mode. This allows simulating an offline stack without
having to purge the service file from all cloud formation references, which may
not exist yet (or will never exist if running on a novel stage). The plugin
can be configured to generate fake ARNs so that other offline plugins that rely
on ARN values can still emulate the offline behavior (e.g. serverless-offline-kinesis)

# Installation

First, add the plugin to your project:

`npm install --save-dev serverless-offline-cfstrip`

Then, inside your project's `serverless.yml` file add `serverless-offline-cfstrip`
to the top-level plugins section.  If there is no plugin section you will need
to add it to the file.

```YAML
plugins:
  - serverless-offline-cfstrip
```

# Configuration

The plugin's behavior is configured with values in the `custom.serverless-offline-cfstrip`
section of your `serverless.yml` file. The possible values are:

```YAML
custom:
  serverless-offline-cfstrip:
    regexFlags: i               # Flags to use for regex matching (defaults to 'i')
    replacements:               # Mapping of regex replacements
      streamArn: arn:aws:kinesis:$REGION:00000000:stream/$STACK
```

The most important section is the replacements configuration entry. This entry
contains a mapping of Regex (RE) to a replacement string (RS). Each RE is matched
against the cloud formation reference (CFR) output name (ON). If the RE matches
the ON, the entire CFR will be replaced with the RS. The following special tokens
may be included in the RS which will be replaced by the appropriate value:

* `$REGION`
* `$STACK`
* `$OUTPUT`

Keep in mind that CFRs are of the form `${cf.REGION:STACK.OUTPUT}` or `${cf:STACK.OUTPUT}`


# Troubleshooting

The plugin will log all applied replacements if the environment variable `SLS_DEBUG` is
set. By convention, this variable is set to the value `*`, e.g.:

`SLS_DEBUG=* sls offline`
