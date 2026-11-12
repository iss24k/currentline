export function assemblyPart(name, nodes, axis, distance, anchor) {
  return { name, nodes: Array.isArray(nodes) ? nodes : [nodes], axis, distance, anchor };
}

export function setInspection(model, parts, { hidden = [], shell = [] } = {}) {
  model.userData.inspection = parts;
  model.userData.inspectionHidden = hidden;
  model.userData.inspectionShell = shell;
  for (const node of hidden) node.visible = false;
  return model;
}
