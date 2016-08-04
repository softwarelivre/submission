(function() {
  "use strict";

  angular
    .module("segue.submission.humanized", [ 'segue.submission' ])
    .constant("HumanizedStrings", {
        // categories
        'business':          'corporativo',
        'caravan':           'caravanista',
        'caravan-leader':    'líder de caravana',
        'foreigner':         'estrangeiro',
        'foreigner-student': 'estrangeiro estudante',
        'government':        'empenho',
        'normal':            'individual',
        'promocode':         'código promocional',
        'corporate-promocode': 'corporativo',
        'gov-promocode':       'corporativo',
        'proponent':         'proponente',
        'proponent-student': 'proponente estudante',
        'speaker':           'palestrante',
        'student':           'Estudante',
        'volunteer':         'voluntário',
        'press':             'imprensa',

        'person': 'Física', 

        // payment types
        'cash':      'dinheiro',

        // purchase statuses
        'pending':    'pendente',
        'paid':       'pago',
        'reimbursed': 'reembolsado',
        'stale':      'vencido',

        // certificates
        'attendant': 'participante',
        'issued':    'emitido',
        'issuable':  'pendente',

        // proposal levels
        'beginner': 'iniciante',
        'advanced': 'avançado',

        // disability types
        'none':     'Não',
        'physical': 'Física',
        'hearing':  'Auditiva',
        'visual':   'Visual',
        'mental':   'Mental',

        // ocupation types
        //'student': 'Estudante',
        'private_employee': 'Empregado',
        'public_employee': 'Funcionário Público',
        'businessman': 'Empresário',
        'freelancer': 'Autônomo',
        'professor': 'Professor',

        // education
        'post_graduation_stricto': 'Mestrado/Doutorado',
        'post_graduation_lato': 'Pós Graduação/Especialização',
        'graduation': 'Ensino Superior Completo',
        'graduation_incomplete': 'Ensino Superior Incompleto',
        'secondary': 'Ensino Médio Completo',
        'secondary_incomplete': 'Ensino Médio Incompleto'

    });
})();
