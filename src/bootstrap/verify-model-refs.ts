import type { SchemaType } from 'mongoose';
import mongoose from 'mongoose';

/**
 * Verifies that every `ref: 'X'` used across our schemas points at a
 * model name that is actually registered with Mongoose.
 *
 * Importing a model file registers it via mongoose.model(name, schema)
 * as a side effect - no DB connection is required for that part. This
 * script exploits that: it imports every model module, then walks every
 * registered schema's paths looking for `ref` options, and fails loudly
 * if any ref doesn't match a real registered model name.
 *
 * This exists because of a real bug: Organization is registered as
 * mongoose.model('Tenant', ...), but six other schemas declared
 * `ref: 'Organization'` instead of `ref: 'Tenant'`. Nothing failed at
 * import time or at tsc time - it only throws MissingSchemaError the
 * moment something calls .populate() on one of those fields. This
 * script catches that class of mistake ahead of time.
 *
 * Run with: npx tsx src/bootstrap/verify-model-refs.ts
 */

async function main() {
  // Import every model module so it registers itself with Mongoose.
  // (Side-effect imports - the bindings themselves aren't used.)
  await import('../modules/auth/model/user.model.js');
  await import('../modules/organizations/model/organization.model.js');
  await import('../modules/role/model/role.model.js');
  await import('../modules/permission/model/permission.model.js');
  await import('../modules/membership/model/membership.model.js');
  await import('../modules/invitation/model/invitation.model.js');
  await import('../modules/audit/model/audit-log.model.js');
  await import('../modules/application/model/application.model.js');
  await import('../modules/apikey/model/api-key.model.js');
  await import('../modules/session/model/session.model.js');
  await import('../modules/oauth/model/oauth-client.model.js');
  await import('../modules/oauth/model/authorization-code.model.js');
  await import('../modules/oauth/model/oauth-access-token.model.js');
  await import('../modules/oauth/model/oauth-refresh-token.model.js');
  await import('../modules/webhook/model/webhook.model.js');
  await import('../modules/webhook/model/webhook-delivery.model.js');
  await import('../modules/settings/model/user-settings.model.js');
  await import('../modules/admin/model/system-settings.model.js');

  const registeredModelNames = new Set(mongoose.modelNames());
  const problems: string[] = [];

  for (const modelName of mongoose.modelNames()) {
    const schema = mongoose.model(modelName).schema;

    schema.eachPath((pathName: string, schemaType: SchemaType) => {
      const ref = (schemaType.options as { ref?: unknown }).ref;
      if (typeof ref !== 'string') return;

      if (!registeredModelNames.has(ref)) {
        problems.push(
          `${modelName}.${pathName} has ref: '${ref}', but no model is registered ` +
            `under that name. Registered models: [${[...registeredModelNames].join(', ')}]`,
        );
      }
    });
  }

  if (problems.length > 0) {
    console.error('✗ Model ref check FAILED:\n');
    for (const problem of problems) {
      console.error(`  - ${problem}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`✓ All schema refs across ${registeredModelNames.size} models resolve correctly.`);
}

main().catch((error) => {
  console.error('✗ verify-model-refs crashed:', error);
  process.exitCode = 1;
});
