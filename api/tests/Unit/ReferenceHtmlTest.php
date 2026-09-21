<?php

namespace Tests\Unit;

use App\Support\ReferenceHtml;
use Tests\TestCase;

class ReferenceHtmlTest extends TestCase
{
    public function test_it_rewrites_reos_and_reonix_labels_to_portal(): void
    {
        $html = 'Open <b>ReOS CRM</b> or REOS CRM or ReOS or Reonix now.';

        $this->assertSame(
            'Open <b>Portal</b> or Portal or Portal or Portal now.',
            ReferenceHtml::rewrite($html),
        );
    }

    public function test_it_rewrites_the_provider_credit_to_sinap(): void
    {
        $html = '<a href="https://re-os.com" target="_blank"><img src="/x.png" alt="Re-os"></a>';

        $this->assertSame(
            '<span class="service-provider">Sinap</span>',
            ReferenceHtml::rewrite($html),
        );
    }
}
