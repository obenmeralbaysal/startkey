<?php

namespace Tests\Feature;

use App\Models\TrainingApplication;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\SeedsAcademyFixtures;
use Tests\TestCase;

class AcademyFormApiTest extends TestCase
{
    use RefreshDatabase;
    use SeedsAcademyFixtures;

    protected function setUp(): void
    {
        parent::setUp();
        \Illuminate\Support\Facades\Cache::flush();
        $this->seedAcademyFixtures();
    }

    public function test_it_stores_a_contact_message(): void
    {
        $this->postJson('/api/v1/contact', [
            'name' => 'Ayşe',
            'surname' => 'Yılmaz',
            'email' => 'ayse@example.com',
            'phone' => '+90 232 330 5330',
            'subject' => 'Bilgi',
            'message' => 'Merhaba',
            'locale' => 'tr',
        ])
            ->assertCreated()
            ->assertJsonPath('data.id', 1);

        $this->assertDatabaseHas('contact_messages', [
            'email' => 'ayse@example.com',
            'name' => 'Ayşe',
            'subject' => 'Bilgi',
        ]);
    }

    public function test_contact_rejects_invalid_input_in_the_requested_locale(): void
    {
        $this->postJson('/api/v1/contact', [
            'name' => '',
            'surname' => '',
            'email' => 'not-an-email',
            'message' => '',
            'locale' => 'tr',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'surname', 'email', 'message'])
            ->assertJsonPath('errors.name.0', 'Ad alanı zorunludur.');
    }

    public function test_it_stores_a_training_application(): void
    {
        $this->postJson('/api/v1/trainings/385/applications', [
            'first_name' => 'Ayşe',
            'last_name' => 'Yılmaz',
            'email' => 'ayse@example.com',
            'phone' => '+90 555 000 00 00',
            'gender_id' => 2,
            'locale' => 'tr',
        ])
            ->assertCreated();

        $this->assertSame(1, TrainingApplication::query()->count());
        $this->assertSame(385, TrainingApplication::query()->first()?->training?->external_id);
    }

    public function test_training_application_returns_not_found_for_a_completed_seminar(): void
    {
        $this->postJson('/api/v1/trainings/380/applications', [
            'email' => 'ayse@example.com',
            'phone' => '+90 555 000 00 00',
            'gender_id' => 1,
            'locale' => 'tr',
        ])->assertStatus(404);
    }

    public function test_training_application_returns_not_found_for_an_unknown_seminar(): void
    {
        $this->postJson('/api/v1/trainings/999/applications', [
            'email' => 'ayse@example.com',
            'phone' => '+90 555 000 00 00',
            'gender_id' => 1,
            'locale' => 'tr',
        ])->assertStatus(404);
    }

    public function test_contact_throttles_repeated_submissions_from_the_same_client(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/contact', [
                'name' => 'Ayşe',
                'surname' => 'Yılmaz',
                'email' => "user{$i}@example.com",
                'message' => 'Merhaba',
                'locale' => 'tr',
            ])->assertCreated();
        }

        $this->postJson('/api/v1/contact', [
            'name' => 'Ayşe',
            'surname' => 'Yılmaz',
            'email' => 'user5@example.com',
            'message' => 'Merhaba',
            'locale' => 'tr',
        ])->assertStatus(429);
    }

    public function test_it_rejects_a_missing_captcha_when_a_secret_is_configured(): void
    {
        config(['site.recaptcha_v3_secret' => 'test-secret']);

        $this->postJson('/api/v1/contact', [
            'name' => 'Ayşe',
            'surname' => 'Yılmaz',
            'email' => 'ayse@example.com',
            'message' => 'Merhaba',
            'locale' => 'tr',
        ])
            ->assertStatus(422)
            ->assertJsonPath('errors.captcha_token.0', 'Doğrulama başarısız oldu.');
    }
}
