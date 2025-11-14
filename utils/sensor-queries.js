export const getSensors = `SELECT * FROM sensors s ORDER by code;`;

export const getSensorsOffsets = `
	SELECT * FROM sensors_offsets s
	ORDER by device_id, code;
`;
