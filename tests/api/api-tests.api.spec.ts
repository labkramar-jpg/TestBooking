import { expect, test } from '@playwright/test';
import { env } from '../config/env';

const API_BASE_URL = env.apiBaseUrl;

test.describe('Public objects API', () => {
  test('GET /objects returns list of objects', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/objects`);
    expect(response.status()).toBe(200);

    const body = (await response.json()) as unknown;
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('POST /objects creates object', async ({ request }) => {
    const uniqueName = `Apple iPad Air ${Date.now()}`;
    const color = '11Cloudy White';
    const capacityGb = 51211;

    const payload = {
      name: uniqueName,
      data: {
        color,
        'capacity GB': capacityGb,
      },
    };

    const createResponse = await request.post(`${API_BASE_URL}/objects`, {
      data: payload,
    });
    expect(createResponse.status()).toBe(200);

    const created = (await createResponse.json()) as {
      id: string;
      name: string;
      data: { color: string; 'capacity GB': number };
    };
    expect(created).toHaveProperty('id');
    expect(created).toHaveProperty('name');
    expect(created).toHaveProperty('data');
    expect(created.id).toBeTruthy();
    expect(created.name).toBe(uniqueName);
    expect(created.data.color).toBe(color);
    expect(created.data['capacity GB']).toBe(capacityGb);
  });

  test('DELETE /objects/{id} removes object created in this test', async ({ request }) => {
    const deleteCandidateName = `Delete candidate ${Date.now()}`;
    const createForDeleteResponse = await request.post(`${API_BASE_URL}/objects`, {
      data: {
        name: deleteCandidateName,
        data: {
          color: 'Midnight Blue',
          'capacity GB': 256,
        },
      },
    });
    expect(createForDeleteResponse.status()).toBe(200);

    const createdForDelete = (await createForDeleteResponse.json()) as { id: string; name: string };
    expect(createdForDelete.id).toBeTruthy();
    expect(createdForDelete.name).toBe(deleteCandidateName);
    const objectId = createdForDelete.id;

    const deleteResponse = await request.delete(`${API_BASE_URL}/objects/${objectId}`);
    expect(deleteResponse.status()).toBe(200);

    const deleted = (await deleteResponse.json()) as { message?: string };
    const message = deleted.message ?? '';
    expect(message).toContain(objectId);
    expect(message.toLowerCase()).toContain('has been deleted');
  });
});
